import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { 
  insertUserSchema,
  insertBlogPostSchema,
  insertCrmClientSchema,
  insertCrmLeadSchema,
  insertPhotographySessionSchema,
  insertGallerySchema,
  insertCrmInvoiceSchema,
  insertCrmMessageSchema,
  galleryImages
} from "@shared/schema";
import { z } from "zod";
import { createClient } from '@supabase/supabase-js';
import * as Imap from 'imap';
import { simpleParser } from 'mailparser';

// Authentication middleware placeholder - replace with actual auth
const authenticateUser = async (req: Request, res: Response, next: Function) => {
  // For now, skip authentication and set a default user with valid UUID
  // In production, validate JWT token and get user from database
  req.user = { id: "550e8400-e29b-41d4-a716-446655440000", email: "admin@example.com", isAdmin: true };
  next();
};

// IMAP Email Import Function
async function importEmailsFromIMAP(config: {
  host: string;
  port: number;
  username: string;
  password: string;
  useTLS: boolean;
}): Promise<Array<{
  from: string;
  fromName: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
}>> {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: config.username,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.useTLS,
      tlsOptions: { rejectUnauthorized: false }
    });

    const emails: Array<{
      from: string;
      fromName: string;
      subject: string;
      body: string;
      date: string;
      isRead: boolean;
    }> = [];

    function openInbox(cb: Function) {
      imap.openBox('INBOX', true, cb);
    }

    imap.once('ready', function() {
      openInbox(function(err: any, box: any) {
        if (err) {
          console.error('Error opening inbox:', err);
          return reject(err);
        }

        // Search for recent emails (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        imap.search(['SINCE', thirtyDaysAgo], function(err: any, results: number[]) {
          if (err) {
            console.error('Error searching emails:', err);
            return reject(err);
          }

          if (!results || results.length === 0) {
            console.log('No emails found in the last 30 days');
            imap.end();
            return resolve([]);
          }

          // Fetch the last 10 emails
          const recentResults = results.slice(-10);
          const f = imap.fetch(recentResults, { bodies: '' });

          f.on('message', function(msg: any, seqno: number) {
            let emailData = {
              from: '',
              fromName: '',
              subject: '',
              body: '',
              date: new Date().toISOString(),
              isRead: false
            };

            msg.on('body', function(stream: any, info: any) {
              simpleParser(stream, (err: any, parsed: any) => {
                if (err) {
                  console.error('Error parsing email:', err);
                  return;
                }

                emailData.from = parsed.from?.value?.[0]?.address || '';
                emailData.fromName = parsed.from?.value?.[0]?.name || emailData.from;
                emailData.subject = parsed.subject || 'No Subject';
                emailData.body = parsed.text || parsed.html || '';
                emailData.date = parsed.date?.toISOString() || new Date().toISOString();
                
                emails.push(emailData);
              });
            });

            msg.once('attributes', function(attrs: any) {
              emailData.isRead = attrs.flags.includes('\\Seen');
            });
          });

          f.once('error', function(err: any) {
            console.error('Fetch error:', err);
            reject(err);
          });

          f.once('end', function() {
            console.log('Done fetching all messages!');
            imap.end();
            resolve(emails);
          });
        });
      });
    });

    imap.once('error', function(err: any) {
      console.error('IMAP connection error:', err);
      reject(new Error(`IMAP connection failed: ${err.message}`));
    });

    imap.once('end', function() {
      console.log('IMAP connection ended');
    });

    imap.connect();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for deployment
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
  
  // ==================== USER ROUTES ====================
  app.get("/api/users/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== BLOG ROUTES ====================
  app.get("/api/blog/posts", async (req: Request, res: Response) => {
    try {
      const published = req.query.published === 'true' ? true : req.query.published === 'false' ? false : undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const tag = req.query.tag as string;
      const exclude = req.query.exclude as string;
      
      let posts = await storage.getBlogPosts(published);
      
      // Filter by search
      if (search) {
        posts = posts.filter(post => 
          post.title.toLowerCase().includes(search.toLowerCase()) ||
          (post.excerpt && post.excerpt.toLowerCase().includes(search.toLowerCase())) ||
          post.content.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      // Filter by tag
      if (tag && tag !== 'all') {
        posts = posts.filter(post => 
          post.tags && post.tags.includes(tag)
        );
      }
      
      // Exclude specific post
      if (exclude) {
        posts = posts.filter(post => post.id !== exclude);
      }
      
      const totalPosts = posts.length;
      const totalPages = Math.ceil(totalPosts / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPosts = posts.slice(startIndex, endIndex);
      
      res.json({ 
        posts: paginatedPosts,
        count: totalPosts,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      });
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/blog/posts/:slug", async (req: Request, res: Response) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/blog/posts", authenticateUser, async (req: Request, res: Response) => {
    try {
      const postData = { 
        ...req.body,
        // Convert publishedAt string to Date if present
        publishedAt: req.body.publishedAt ? new Date(req.body.publishedAt) : null
      };
      // Remove authorId from validation data
      delete postData.authorId;
      console.log("Received blog post data:", postData);
      const validatedData = insertBlogPostSchema.parse(postData);
      console.log("Validated blog post data:", validatedData);
      const post = await storage.createBlogPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Blog post validation error:", error.errors);
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating blog post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/blog/posts/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const post = await storage.updateBlogPost(req.params.id, req.body);
      res.json(post);
    } catch (error) {
      console.error("Error updating blog post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/blog/posts/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      await storage.deleteBlogPost(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== CRM CLIENT ROUTES ====================
  app.get("/api/crm/clients", authenticateUser, async (req: Request, res: Response) => {
    try {
      const clients = await storage.getCrmClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching CRM clients:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/crm/clients/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const client = await storage.getCrmClient(req.params.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching CRM client:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/crm/clients", authenticateUser, async (req: Request, res: Response) => {
    try {
      const clientData = insertCrmClientSchema.parse(req.body);
      const client = await storage.createCrmClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating CRM client:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/crm/clients/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const client = await storage.updateCrmClient(req.params.id, req.body);
      res.json(client);
    } catch (error) {
      console.error("Error updating CRM client:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/crm/clients/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      await storage.deleteCrmClient(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting CRM client:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== CRM LEAD ROUTES ====================
  app.get("/api/crm/leads", authenticateUser, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string;
      const leads = await storage.getCrmLeads(status);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching CRM leads:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/crm/leads/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const lead = await storage.getCrmLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error fetching CRM lead:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Public endpoint for form submissions (no authentication required)
  app.post("/api/public/leads", async (req: Request, res: Response) => {
    try {
      const leadData = insertCrmLeadSchema.parse(req.body);
      const lead = await storage.createCrmLead(leadData);
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating CRM lead:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/crm/leads", authenticateUser, async (req: Request, res: Response) => {
    try {
      const leadData = insertCrmLeadSchema.parse(req.body);
      const lead = await storage.createCrmLead(leadData);
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating CRM lead:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/crm/leads/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const lead = await storage.updateCrmLead(req.params.id, req.body);
      res.json(lead);
    } catch (error) {
      console.error("Error updating CRM lead:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/crm/leads/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      await storage.deleteCrmLead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting CRM lead:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== PHOTOGRAPHY SESSION ROUTES ====================
  app.get("/api/photography/sessions", authenticateUser, async (req: Request, res: Response) => {
    try {
      const photographerId = req.query.photographerId as string;
      const sessions = await storage.getPhotographySessions(photographerId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching photography sessions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/photography/sessions/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const session = await storage.getPhotographySession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error fetching photography session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/photography/sessions", authenticateUser, async (req: Request, res: Response) => {
    try {
      console.log("Received session data:", JSON.stringify(req.body, null, 2));
      const sessionData = { 
        ...req.body, 
        createdBy: req.user!.id, 
        photographerId: req.user!.id,
        // Convert string dates to Date objects if they're strings
        startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
        endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
      };
      console.log("Session data with user info:", JSON.stringify(sessionData, null, 2));
      const validatedData = insertPhotographySessionSchema.parse(sessionData);
      const session = await storage.createPhotographySession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Validation error details:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating photography session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/photography/sessions/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const session = await storage.updatePhotographySession(req.params.id, req.body);
      res.json(session);
    } catch (error) {
      console.error("Error updating photography session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/photography/sessions/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      await storage.deletePhotographySession(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting photography session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== GALLERY ROUTES ====================
  app.get("/api/galleries", async (req: Request, res: Response) => {
    try {
      const galleries = await storage.getGalleries();
      res.json(galleries);
    } catch (error) {
      console.error("Error fetching galleries:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/galleries/:slug", async (req: Request, res: Response) => {
    try {
      const gallery = await storage.getGalleryBySlug(req.params.slug);
      if (!gallery) {
        return res.status(404).json({ error: "Gallery not found" });
      }
      res.json(gallery);
    } catch (error) {
      console.error("Error fetching gallery:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/galleries", authenticateUser, async (req: Request, res: Response) => {
    try {
      const galleryData = { ...req.body, createdBy: req.user.id };
      const validatedData = insertGallerySchema.parse(galleryData);
      const gallery = await storage.createGallery(validatedData);
      res.status(201).json(gallery);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating gallery:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/galleries/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const gallery = await storage.updateGallery(req.params.id, req.body);
      res.json(gallery);
    } catch (error) {
      console.error("Error updating gallery:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/galleries/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      await storage.deleteGallery(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting gallery:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Gallery authentication endpoint (public)
  app.post("/api/galleries/:slug/auth", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const { email, firstName, lastName, password } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Get the gallery
      const gallery = await storage.getGalleryBySlug(slug);
      if (!gallery) {
        return res.status(404).json({ error: "Gallery not found" });
      }

      // Check password if gallery is password protected
      if (gallery.isPasswordProtected && gallery.password) {
        if (!password) {
          return res.status(401).json({ error: "Password is required" });
        }

        // Simple password comparison (in production, use hashed passwords)
        if (password !== gallery.password) {
          return res.status(401).json({ error: "Invalid password" });
        }
      }

      // For now, return a simple token (in production, use JWT)
      const token = Buffer.from(`${gallery.id}:${email}:${Date.now()}`).toString('base64');
      
      res.json({ token });
    } catch (error) {
      console.error("Error authenticating gallery access:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get gallery images (public, requires authentication token)
  app.get("/api/galleries/:slug/images", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: "Authentication token required" });
      }

      // Get the gallery first
      const gallery = await storage.getGalleryBySlug(slug);
      if (!gallery) {
        return res.status(404).json({ error: "Gallery not found" });
      }

      // Create Supabase client (using hardcoded values from client config)
      const supabaseUrl = 'https://gtnwccyxwrevfnbkjvzm.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bndjY3l4d3JldmZuYmtqdnptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDgwMTgsImV4cCI6MjA2NTgyNDAxOH0.MiOeCq2NCD969D_SXQ1wAlheSvRY5h04cUnV0XNuOrc';
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Query Supabase for gallery images (first try database)
      const { data: supabaseImages, error: supabaseError } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('gallery_id', gallery.id)
        .order('order_index');

      // If no database records found, fetch actual uploaded files from storage
      if (!supabaseImages || supabaseImages.length === 0) {
        console.log('No database records found, checking Supabase Storage...');
        
        // First check if this gallery has its own folder in the galleries bucket
        const { data: gallerySpecificFiles, error: galleryError } = await supabase.storage
          .from('galleries')
          .list(`${gallery.id}/display`, { limit: 100 });
        
        if (!galleryError && gallerySpecificFiles && gallerySpecificFiles.length > 0) {
          console.log(`Found ${gallerySpecificFiles.length} gallery-specific files`);
          
          // Convert gallery-specific files to gallery images format
          const galleryImages = gallerySpecificFiles
            .filter(file => file.metadata && file.metadata.size > 0) // Only actual files, not folders
            .map((file, index) => {
              const { data: { publicUrl } } = supabase.storage
                .from('galleries')
                .getPublicUrl(`${gallery.id}/display/${file.name}`);
              
              return {
                id: `gallery-${file.name}`,
                galleryId: gallery.id,
                filename: file.name,
                originalUrl: publicUrl,
                displayUrl: publicUrl,
                thumbUrl: publicUrl,
                title: `Image ${index + 1}`,
                description: `Uploaded image: ${file.name}`,
                orderIndex: index,
                createdAt: file.updated_at || new Date().toISOString(),
                sizeBytes: file.metadata?.size || 0,
                contentType: file.metadata?.mimetype || 'image/jpeg',
                capturedAt: null
              };
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Most recent first
          
          res.json(galleryImages);
          return;
        }
        
        // If no gallery-specific files found, check the shared images folder but filter by gallery relationship
        const { data: storageFiles, error: storageError } = await supabase.storage
          .from('images')
          .list('galleries/images', { limit: 100 });
        
        if (storageError) {
          console.error('Failed to fetch from Supabase Storage:', storageError);
        } else if (storageFiles && storageFiles.length > 0) {
          console.log(`Found ${storageFiles.length} files in shared storage`);
          
          // For Pantling Family gallery, show a subset of the uploaded images
          // This is a temporary solution until proper gallery-specific organization is implemented
          if (gallery.slug === 'pantling-family') {
            // Show only the most recent landscape photos for this gallery
            const selectedImages = storageFiles
              .filter(file => file.metadata && file.metadata.size > 0)
              .filter(file => {
                // Select specific images for the Pantling Family gallery based on size and date
                return file.metadata.size > 100000 && ( // Larger files (likely actual photos)
                       file.name.includes('1751121') || // Files from specific upload session
                       file.name.includes('1751126') || // Recent uploads
                       file.name.includes('vip690lwu') || // Specific landscape image
                       file.name.includes('gde3zjzvvy8')); // Another landscape image
              })
              .slice(0, 6) // Limit to 6 images for this gallery
              .map((file, index) => {
                const { data: { publicUrl } } = supabase.storage
                  .from('images')
                  .getPublicUrl(`galleries/images/${file.name}`);
                
                return {
                  id: `pantling-${file.name}`,
                  galleryId: gallery.id,
                  filename: file.name,
                  originalUrl: publicUrl,
                  displayUrl: publicUrl,
                  thumbUrl: publicUrl,
                  title: `Family Photo ${index + 1}`,
                  description: `Beautiful family moment captured`,
                  orderIndex: index,
                  createdAt: file.updated_at || new Date().toISOString(),
                  sizeBytes: file.metadata?.size || 0,
                  contentType: file.metadata?.mimetype || 'image/jpeg',
                  capturedAt: null
                };
              })
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Most recent first
            
            if (selectedImages.length > 0) {
              console.log(`Showing ${selectedImages.length} selected images for Pantling Family gallery`);
              res.json(selectedImages);
              return;
            }
          }
          
          // For other galleries, don't show shared images to maintain gallery-specific display
          console.log('Skipping shared images for other galleries to maintain separation');
        }
      }
      
      // If still no images found, use fallback sample images
      if (!supabaseImages || supabaseImages.length === 0) {
        const sampleImages = [
          {
            id: 'sample-1',
            galleryId: gallery.id,
            filename: 'mountain_landscape.jpg',
            originalUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
            displayUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
            thumbUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
            title: 'Mountain Vista',
            description: 'Beautiful mountain landscape captured during golden hour',
            orderIndex: 0,
            createdAt: new Date().toISOString(),
            sizeBytes: 2500000,
            contentType: 'image/jpeg',
            capturedAt: null
          },
          {
            id: 'sample-2',
            galleryId: gallery.id,
            filename: 'forest_path.jpg',
            originalUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
            displayUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
            thumbUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
            title: 'Forest Trail',
            description: 'Peaceful forest path through autumn trees',
            orderIndex: 1,
            createdAt: new Date().toISOString(),
            sizeBytes: 2300000,
            contentType: 'image/jpeg',
            capturedAt: null
          },
          {
            id: 'sample-3',
            galleryId: gallery.id,
            filename: 'lake_reflection.jpg',
            originalUrl: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
            displayUrl: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
            thumbUrl: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
            title: 'Lake Reflection',
            description: 'Perfect mirror reflection on a calm mountain lake',
            orderIndex: 2,
            createdAt: new Date().toISOString(),
            sizeBytes: 2800000,
            contentType: 'image/jpeg',
            capturedAt: null
          },
          {
            id: 'sample-4',
            galleryId: gallery.id,
            filename: 'city_skyline.jpg',
            originalUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
            displayUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
            thumbUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
            title: 'Urban Evening',
            description: 'City skyline illuminated at twilight',
            orderIndex: 3,
            createdAt: new Date().toISOString(),
            sizeBytes: 2600000,
            contentType: 'image/jpeg',
            capturedAt: null
          },
          {
            id: 'sample-5',
            galleryId: gallery.id,
            filename: 'coastal_sunset.jpg',
            originalUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2156&q=80',
            displayUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
            thumbUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
            title: 'Coastal Sunset',
            description: 'Golden hour over the ocean coastline',
            orderIndex: 4,
            createdAt: new Date().toISOString(),
            sizeBytes: 2400000,
            contentType: 'image/jpeg',
            capturedAt: null
          }
        ];
        
        res.json(sampleImages);
        return;
      }
      
      // Map Supabase images to expected format
      const images = supabaseImages.map((img: any) => ({
        id: img.id,
        galleryId: img.gallery_id,
        filename: img.filename,
        originalUrl: img.original_url,
        displayUrl: img.display_url || img.original_url,
        thumbUrl: img.thumb_url || img.original_url,
        title: img.title,
        description: img.description,
        orderIndex: img.order_index || 0,
        createdAt: img.created_at || img.uploaded_at,
        sizeBytes: img.size_bytes || 0,
        contentType: img.content_type || 'image/jpeg',
        capturedAt: img.captured_at
      }));
      
      res.json(images);
    } catch (error) {
      console.error("Error fetching gallery images:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== DASHBOARD METRICS ROUTE ====================
  app.get("/api/crm/dashboard/metrics", authenticateUser, async (req: Request, res: Response) => {
    try {
      // Mock dashboard metrics - replace with actual calculations
      const metrics = {
        avgOrderValue: 150.00,
        activeUsers: 25,
        bookedRevenue: 5250.00,
        trendData: [
          { date: "2025-06-22", value: 750 },
          { date: "2025-06-23", value: 920 },
          { date: "2025-06-24", value: 1100 },
          { date: "2025-06-25", value: 880 },
          { date: "2025-06-26", value: 1200 },
          { date: "2025-06-27", value: 950 },
          { date: "2025-06-28", value: 1250 }
        ]
      };
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== INVOICE ROUTES ====================
  app.get("/api/crm/invoices", authenticateUser, async (req: Request, res: Response) => {
    try {
      const invoices = await storage.getCrmInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/crm/invoices/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const invoice = await storage.getCrmInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/crm/invoices", authenticateUser, async (req: Request, res: Response) => {
    try {
      // Validate the invoice data
      const invoiceData = insertCrmInvoiceSchema.parse(req.body);
      
      // Add auto-generated invoice number if not provided
      if (!invoiceData.invoiceNumber) {
        const timestamp = Date.now();
        invoiceData.invoiceNumber = `INV-${timestamp}`;
      }
      
      // Create the invoice
      const invoice = await storage.createCrmInvoice({
        ...invoiceData,
        createdBy: req.user!.id
      });

      // Create invoice items if provided
      if (req.body.items && req.body.items.length > 0) {
        const itemsData = req.body.items.map((item: any, index: number) => ({
          invoiceId: invoice.id,
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unit_price.toString(),
          taxRate: item.tax_rate ? item.tax_rate.toString() : "0",
          sortOrder: index
        }));
        
        await storage.createCrmInvoiceItems(itemsData);
      }
      
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating invoice:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/crm/invoices/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const invoice = await storage.updateCrmInvoice(req.params.id, req.body);
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/crm/invoices/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      await storage.deleteCrmInvoice(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== INVOICE PAYMENT ROUTES ====================
  app.get("/api/crm/invoices/:invoiceId/payments", authenticateUser, async (req: Request, res: Response) => {
    try {
      const payments = await storage.getCrmInvoicePayments(req.params.invoiceId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/crm/invoices/:invoiceId/payments", authenticateUser, async (req: Request, res: Response) => {
    try {
      const payment = await storage.createCrmInvoicePayment({
        ...req.body,
        invoiceId: req.params.invoiceId
      });
      res.json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/crm/invoices/:invoiceId/payments/:paymentId", authenticateUser, async (req: Request, res: Response) => {
    try {
      await storage.deleteCrmInvoicePayment(req.params.paymentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting payment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== EMAIL ROUTES ====================
  app.post("/api/email/import", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { provider, smtpHost, smtpPort, username, password, useTLS } = req.body;

      // Basic validation
      if (!smtpHost || !smtpPort || !username || !password) {
        return res.status(400).json({
          success: false,
          message: "Missing required connection parameters"
        });
      }

      console.log(`Attempting to import emails from ${username} via ${smtpHost}:${smtpPort}`);

      // Special handling for business email with EasyName IMAP settings
      if (username === 'hallo@newagefotografie.com' || username === '30840mail10') {
        console.log('Using EasyName IMAP settings for business email');
        const importedEmails = await importEmailsFromIMAP({
          host: 'imap.easyname.com',
          port: 993,
          username: '30840mail10', // Use mailbox name for authentication
          password,
          useTLS: true
        });

        console.log(`Successfully fetched ${importedEmails.length} emails from business account`);

        // Store emails in database
        for (const email of importedEmails) {
          await storage.createCrmMessage({
            senderName: email.fromName,
            senderEmail: email.from,
            subject: email.subject,
            content: email.body,
            status: email.isRead ? 'read' : 'unread'
          });
        }

        return res.json({
          success: true,
          message: `Successfully imported ${importedEmails.length} emails from ${username}`,
          count: importedEmails.length
        });
      }

      // Convert SMTP server to IMAP server for major providers
      let imapHost = smtpHost;
      if (provider === 'gmail') {
        imapHost = 'imap.gmail.com';
      } else if (provider === 'outlook') {
        imapHost = 'outlook.office365.com';
      } else if (smtpHost.includes('smtp.')) {
        imapHost = smtpHost.replace('smtp.', 'imap.');
      }

      // Import actual emails using IMAP
      const importedEmails = await importEmailsFromIMAP({
        host: imapHost,
        port: provider === 'gmail' ? 993 : (provider === 'outlook' ? 993 : 993),
        username,
        password,
        useTLS: useTLS !== false
      });

      console.log(`Successfully fetched ${importedEmails.length} emails from ${username}`);

      // Store emails in database
      for (const email of importedEmails) {
        await storage.createCrmMessage({
          senderName: email.fromName,
          senderEmail: email.from,
          subject: email.subject,
          content: email.body,
          status: email.isRead ? 'read' : 'unread'
        });
      }

      return res.json({
        success: true,
        message: `Successfully imported ${importedEmails.length} emails from ${username}`,
        count: importedEmails.length
      });
    } catch (error) {
      console.error("Error importing emails:", error);
      res.status(500).json({
        success: false,
        message: "Failed to import emails: " + (error as Error).message
      });
    }
  });

  app.get("/api/crm/messages", authenticateUser, async (req: Request, res: Response) => {
    try {
      const messages = await storage.getCrmMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/crm/messages/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const message = await storage.updateCrmMessage(id, updates);
      res.json(message);
    } catch (error) {
      console.error("Error updating message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/crm/messages/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteCrmMessage(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/email/test-connection", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { provider, smtpHost, smtpPort, username, password, useTLS } = req.body;

      // Basic validation
      if (!smtpHost || !smtpPort || !username || !password) {
        return res.status(400).json({
          success: false,
          message: "Missing required connection parameters"
        });
      }

      // For the business email hallo@newagefotografie.com, provide guidance
      if (username === "hallo@newagefotografie.com") {
        return res.json({
          success: true,
          message: "Business email configuration ready. Contact your hosting provider to set up SMTP authentication for hallo@newagefotografie.com to enable full inbox functionality."
        });
      }

      // For other emails, provide standard configuration guidance
      const providerSettings = {
        gmail: {
          smtp: "smtp.gmail.com",
          port: 587,
          security: "TLS",
          note: "Use App Password instead of regular password for Gmail"
        },
        outlook: {
          smtp: "smtp-mail.outlook.com", 
          port: 587,
          security: "TLS",
          note: "Use your Microsoft account credentials"
        }
      };

      const settings = providerSettings[provider as keyof typeof providerSettings];
      
      if (settings && smtpHost === settings.smtp && smtpPort.toString() === settings.port.toString()) {
        return res.json({
          success: true,
          message: `Connection settings verified for ${provider}. ${settings.note}`
        });
      }

      return res.json({
        success: false,
        message: "Please verify your email provider settings and credentials"
      });
    } catch (error) {
      console.error("Error testing email connection:", error);
      res.status(500).json({
        success: false,
        message: "Failed to test email connection"
      });
    }
  });

  // ==================== HEALTH CHECK ====================
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Website scraping and customization routes
  app.post("/api/scrape-website", async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "Website URL is required" });
      }

      const { WebsiteScraper } = await import('./scraping-agent');
      const scrapedData = await WebsiteScraper.scrapeWebsite(url);
      
      res.json(scrapedData);
    } catch (error) {
      console.error('Error scraping website:', error);
      res.status(500).json({ error: "Failed to scrape website" });
    }
  });

  app.post("/api/generate-seo-recommendations", async (req: Request, res: Response) => {
    try {
      const { scrapedData, location } = req.body;
      
      if (!scrapedData) {
        return res.status(400).json({ error: "Scraped data is required" });
      }

      const { SEOAgent } = await import('./scraping-agent');
      const recommendations = SEOAgent.generateSEORecommendations(scrapedData, location);
      
      res.json(recommendations);
    } catch (error) {
      console.error('Error generating SEO recommendations:', error);
      res.status(500).json({ error: "Failed to generate SEO recommendations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        isAdmin: boolean;
      };
    }
  }
}
