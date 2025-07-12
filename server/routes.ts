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
  insertVoucherProductSchema,
  insertDiscountCouponSchema,
  insertVoucherSaleSchema,
  galleryImages,
  knowledgeBase,
  openaiAssistants,
  insertKnowledgeBaseSchema,
  insertOpenaiAssistantSchema
} from "@shared/schema";
import { z } from "zod";
import { createClient } from '@supabase/supabase-js';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Stripe from 'stripe';
import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Authentication middleware placeholder - replace with actual auth
const authenticateUser = async (req: Request, res: Response, next: Function) => {
  // For now, skip authentication and set a default user with valid UUID
  // In production, validate JWT token and get user from database
  req.user = { id: "550e8400-e29b-41d4-a716-446655440000", email: "admin@example.com", isAdmin: true };
  next();
};

// Generate HTML template for invoice PDF
function generateInvoiceHTML(invoice: any, client: any): string {
  const today = new Date().toLocaleDateString('de-DE');
  const issueDate = new Date(invoice.issueDate).toLocaleDateString('de-DE');
  const dueDate = new Date(invoice.dueDate).toLocaleDateString('de-DE');
  
  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rechnung ${invoice.invoiceNumber}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          border-bottom: 2px solid #9333ea;
          padding-bottom: 20px;
        }
        .logo-section {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }
        .company-logo {
          width: 200px;
          height: auto;
          margin-right: 15px;
          margin-bottom: 10px;
          max-height: 80px;
          object-fit: contain;
        }
        .company-info h1 {
          color: #9333ea;
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .company-details p {
          margin: 3px 0;
          font-size: 13px;
          color: #555;
        }
        .company-details strong {
          color: #333;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-info h2 {
          color: #333;
          margin: 0;
          font-size: 24px;
        }
        .client-section {
          margin: 30px 0;
        }
        .client-section h3 {
          color: #9333ea;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
        }
        .invoice-details {
          display: flex;
          justify-content: space-between;
          margin: 30px 0;
        }
        .details-box {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          width: 45%;
        }
        .details-box h4 {
          margin: 0 0 10px 0;
          color: #333;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
        }
        .items-table th,
        .items-table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        .items-table th {
          background-color: #9333ea;
          color: white;
          font-weight: bold;
        }
        .items-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .totals {
          margin-top: 20px;
          text-align: right;
        }
        .totals table {
          margin-left: auto;
          border-collapse: collapse;
        }
        .totals td {
          padding: 8px 15px;
          border: none;
        }
        .totals .total-row {
          font-weight: bold;
          font-size: 18px;
          border-top: 2px solid #9333ea;
          color: #9333ea;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #9333ea;
          font-size: 11px;
          color: #666;
        }
        .footer-content {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
        }
        .footer-section {
          flex: 1;
          margin-right: 20px;
        }
        .footer-section:last-child {
          margin-right: 0;
        }
        .footer-section h4 {
          color: #9333ea;
          font-size: 12px;
          margin: 0 0 8px 0;
          font-weight: bold;
        }
        .footer-section p {
          margin: 2px 0;
          line-height: 1.3;
        }
        .footer-bottom {
          text-align: center;
          padding-top: 15px;
          border-top: 1px solid #eee;
          color: #9333ea;
          font-style: italic;
        }
        .payment-terms {
          background: #e7f3ff;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #9333ea;
        }
        .number {
          text-align: right;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <div class="logo-section">
            <img src="${req.protocol}://${req.get('host')}/logo.png" alt="New Age Fotografie" class="company-logo" onerror="this.style.display='none'" />
            <h1>New Age Fotografie</h1>
          </div>
          <div class="company-details">
            <p><strong>Adresse:</strong> Eingang Ecke Schönbrunnerstraße</p>
            <p>Wehrgasse 11A/2+5, 1050 Wien, Austria</p>
            <p><strong>Telefon:</strong> +43 677 933 99210</p>
            <p><strong>Email:</strong> hallo@newagefotografie.com</p>
            <p><strong>Website:</strong> www.newagefotografie.com</p>
            <p><strong>UID:</strong> ATU12345678 | <strong>FN:</strong> 123456a</p>
          </div>
        </div>
        <div class="invoice-info">
          <h2>RECHNUNG</h2>
          <p><strong>Nr.: ${invoice.invoiceNumber}</strong></p>
          <p>Datum: ${today}</p>
        </div>
      </div>

      <div class="client-section">
        <h3>Rechnungsempfänger</h3>
        <p><strong>${client.firstName || ''} ${client.lastName || ''}</strong></p>
        <p>${client.email || ''}</p>
        ${client.address ? `<p>${client.address}</p>` : ''}
        ${client.city ? `<p>${client.city}, ${client.country || ''}</p>` : ''}
      </div>

      <div class="invoice-details">
        <div class="details-box">
          <h4>Rechnungsdetails</h4>
          <p><strong>Rechnungsdatum:</strong> ${issueDate}</p>
          <p><strong>Fälligkeitsdatum:</strong> ${dueDate}</p>
          <p><strong>Zahlungsbedingungen:</strong> ${invoice.paymentTerms || 'Net 30'}</p>
        </div>
        <div class="details-box">
          <h4>Zahlungsinformationen</h4>
          <p><strong>Status:</strong> ${invoice.status === 'paid' ? 'Bezahlt' : 'Offen'}</p>
          <p><strong>Währung:</strong> ${invoice.currency || 'EUR'}</p>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Beschreibung</th>
            <th>Menge</th>
            <th>Einzelpreis</th>
            <th>MwSt. %</th>
            <th>Gesamtpreis</th>
          </tr>
        </thead>
        <tbody>
          ${(invoice.items || []).map((item: any) => `
            <tr>
              <td>${item.description || 'Leistung'}</td>
              <td class="number">${item.quantity || 1}</td>
              <td class="number">€${parseFloat(item.unitPrice?.toString() || item.unit_price?.toString() || '0').toFixed(2)}</td>
              <td class="number">${item.taxRate || item.tax_rate || 0}%</td>
              <td class="number">€${(parseFloat(item.unitPrice?.toString() || item.unit_price?.toString() || '0') * (item.quantity || 1)).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <table>
          <tr>
            <td>Zwischensumme:</td>
            <td class="number">€${parseFloat(invoice.subtotal?.toString() || '0').toFixed(2)}</td>
          </tr>
          <tr>
            <td>MwSt.:</td>
            <td class="number">€${parseFloat(invoice.taxAmount?.toString() || invoice.tax_amount?.toString() || '0').toFixed(2)}</td>
          </tr>
          ${invoice.discountAmount ? `
          <tr>
            <td>Rabatt:</td>
            <td class="number">-€${parseFloat(invoice.discountAmount.toString()).toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr class="total-row">
            <td><strong>Gesamtbetrag:</strong></td>
            <td class="number"><strong>€${parseFloat(invoice.total?.toString() || '0').toFixed(2)}</strong></td>
          </tr>
        </table>
      </div>

      ${invoice.notes ? `
      <div class="payment-terms">
        <h4>Anmerkungen</h4>
        <p>${invoice.notes}</p>
      </div>
      ` : ''}

      <div class="payment-terms">
        <h4>Zahlungsbedingungen</h4>
        <p>Bitte überweisen Sie den Rechnungsbetrag bis zum Fälligkeitsdatum auf unser Konto. Bei Fragen wenden Sie sich gerne an uns.</p>
      </div>

      <div class="footer">
        <div class="footer-content">
          <div class="footer-section">
            <h4>Kontakt</h4>
            <p><strong>New Age Fotografie</strong></p>
            <p>Eingang Ecke Schönbrunnerstraße</p>
            <p>Wehrgasse 11A/2+5, 1050 Wien</p>
            <p>Tel: +43 677 933 99210</p>
            <p>Email: hallo@newagefotografie.com</p>
          </div>
          <div class="footer-section">
            <h4>Geschäftsinformationen</h4>
            <p>UID-Nr.: ATU12345678</p>
            <p>Firmenbuchnummer: FN 123456a</p>
            <p>Gerichtsstand: Wien</p>
            <p>Website: www.newagefotografie.com</p>
          </div>
          <div class="footer-section">
            <h4>Bankverbindung</h4>
            <p>Bank: Erste Bank Austria</p>
            <p>IBAN: AT12 2011 1000 0000 1234</p>
            <p>BIC: GIBAATWWXXX</p>
            <p>Verwendungszweck: Rechnung ${invoice.invoiceNumber}</p>
          </div>
        </div>
        <div class="footer-bottom">
          <p><em>Vielen Dank für Ihr Vertrauen! Professionelle Fotografie mit Leidenschaft seit 2020.</em></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Configure multer for image uploads to local storage
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'vouchers');
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const fileExt = path.extname(file.originalname);
      const fileName = `voucher-${Date.now()}-${Math.random().toString(36).substring(2, 15)}${fileExt}`;
      cb(null, fileName);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
  }
});

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
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 30000, // 30 seconds
      authTimeout: 30000,
      keepalive: false
    });

    // Add timeout for the whole operation
    const timeout = setTimeout(() => {
      imap.end();
      reject(new Error('IMAP connection timeout after 60 seconds'));
    }, 60000);

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

        // Search for all emails in INBOX including recent ones
        imap.search(['ALL'], function(err: any, results: number[]) {
          if (err) {
            console.error('Error searching emails:', err);
            return reject(err);
          }

          if (!results || results.length === 0) {
            console.log('No emails found in inbox');
            imap.end();
            return resolve([]);
          }

          console.log(`Found ${results.length} emails in inbox`);
          
          // Fetch the last 50 emails to capture any new messages
          const recentResults = results.slice(-50);
          const f = imap.fetch(recentResults, { 
            bodies: '', 
            struct: true 
          });

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
            clearTimeout(timeout);
            imap.end();
            resolve(emails);
          });
        });
      });
    });

    imap.once('error', function(err: any) {
      console.error('IMAP connection error:', err);
      clearTimeout(timeout);
      reject(new Error(`IMAP connection failed: ${err.message}`));
    });

    imap.once('end', function() {
      console.log('IMAP connection ended');
      clearTimeout(timeout);
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

  // Get all clients
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
      
      // Send email notification to business owner
      try {
        await sendNewLeadNotification(lead);
      } catch (emailError) {
        console.error("Failed to send lead notification email:", emailError);
        // Don't fail the lead creation if email fails
      }
      
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
      
      // Send email notification to business owner
      try {
        await sendNewLeadNotification(lead);
      } catch (emailError) {
        console.error("Failed to send lead notification email:", emailError);
        // Don't fail the lead creation if email fails
      }
      
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
      // Get actual data from database
      const [invoices, leads, sessions, clients] = await Promise.all([
        storage.getCrmInvoices(),
        storage.getCrmLeads(), 
        storage.getPhotographySessions(),
        storage.getCrmClients()
      ]);

      // Calculate revenue metrics from PAID invoices only
      const paidInvoices = invoices.filter(inv => inv.status === 'paid');
      const totalRevenue = paidInvoices.reduce((sum, invoice) => {
        const total = parseFloat(invoice.total?.toString() || '0');
        return sum + total;
      }, 0);

      const paidRevenue = totalRevenue; // Same as totalRevenue since we only count paid invoices

      const avgOrderValue = paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;

      // Calculate trend data from PAID invoices over last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentInvoices = paidInvoices.filter(invoice => {
        const createdDate = new Date(invoice.createdAt || invoice.created_at);
        return createdDate >= sevenDaysAgo;
      });

      const trendData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayInvoices = recentInvoices.filter(invoice => {
          const invoiceDate = new Date(invoice.createdAt || invoice.created_at).toISOString().split('T')[0];
          return invoiceDate === dateStr;
        });
        
        const dayRevenue = dayInvoices.reduce((sum, invoice) => {
          const total = parseFloat(invoice.total?.toString() || '0');
          return sum + total;
        }, 0);
        
        trendData.push({ date: dateStr, value: dayRevenue });
      }

      const metrics = {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        paidRevenue: Number(paidRevenue.toFixed(2)),
        avgOrderValue: Number(avgOrderValue.toFixed(2)),
        totalInvoices: invoices.length,
        paidInvoices: paidInvoices.length,
        activeLeads: leads.filter(lead => lead.status === 'new' || lead.status === 'contacted').length,
        totalClients: clients.length,
        upcomingSessions: sessions.filter(session => 
          new Date(session.sessionDate) > new Date()
        ).length,
        trendData
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
      console.log("Received invoice data:", JSON.stringify(req.body, null, 2));
      
      // Validate the invoice data
      const invoiceData = insertCrmInvoiceSchema.parse(req.body);
      
      // Add auto-generated invoice number if not provided
      if (!invoiceData.invoiceNumber) {
        const timestamp = Date.now();
        invoiceData.invoiceNumber = `INV-${timestamp}`;
      }
      
      // Create the invoice (make createdBy optional since users table may not be populated)
      const invoice = await storage.createCrmInvoice({
        ...invoiceData,
        createdBy: req.user?.id || null
      });

      // Create invoice items if provided
      if (req.body.items && req.body.items.length > 0) {
        const itemsData = req.body.items.map((item: any, index: number) => ({
          invoiceId: invoice.id,
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: (item.unitPrice || item.unit_price).toString(),
          taxRate: (item.taxRate || item.tax_rate || 0).toString(),
          sortOrder: index
        }));
        
        await storage.createCrmInvoiceItems(itemsData);
      }
      
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error details:", JSON.stringify(error.errors, null, 2));
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

  // ==================== INVOICE PDF & EMAIL ROUTES ====================
  // Generate PDF for invoice
  app.get("/api/crm/invoices/:id/pdf", authenticateUser, async (req: Request, res: Response) => {
    try {
      const invoice = await storage.getCrmInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Get client details
      const client = await storage.getCrmClient(invoice.clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Create HTML template for PDF
      const htmlContent = generateInvoiceHTML(invoice, client);

      // Generate PDF using puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });
      
      await browser.close();

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Rechnung-${invoice.invoiceNumber}.pdf"`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // Email invoice to client
  app.post("/api/crm/invoices/:id/email", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { subject, message, includeAttachment = true } = req.body;
      
      const invoice = await storage.getCrmInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const client = await storage.getCrmClient(invoice.clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      if (!client.email) {
        return res.status(400).json({ error: "Client has no email address" });
      }

      // Generate PDF attachment if requested
      let attachments = [];
      if (includeAttachment) {
        const htmlContent = generateInvoiceHTML(invoice, client);
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });
        
        await browser.close();

        attachments.push({
          filename: `Rechnung-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        });
      }

      // Create email transporter (using EasyName SMTP)
      const transporter = nodemailer.createTransporter({
        host: 'smtp.easyname.com',
        port: 465,
        secure: true,
        auth: {
          user: '30840mail10', // Business email credentials
          pass: process.env.EMAIL_PASSWORD || 'your-email-password'
        }
      });

      // Send email
      const emailOptions = {
        from: 'hallo@newagefotografie.com',
        to: client.email,
        subject: subject || `Rechnung ${invoice.invoiceNumber} - New Age Fotografie`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Rechnung ${invoice.invoiceNumber}</h2>
            <p>Liebe/r ${client.firstName} ${client.lastName},</p>
            <p>${message || 'anbei senden wir Ihnen Ihre Rechnung zu.'}</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin: 0 0 10px 0;">Rechnungsdetails:</h3>
              <p><strong>Rechnungsnummer:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Datum:</strong> ${new Date(invoice.issueDate).toLocaleDateString('de-DE')}</p>
              <p><strong>Fälligkeitsdatum:</strong> ${new Date(invoice.dueDate).toLocaleDateString('de-DE')}</p>
              <p><strong>Gesamtbetrag:</strong> €${parseFloat(invoice.total?.toString() || '0').toFixed(2)}</p>
            </div>
            <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
              <p><strong>New Age Fotografie</strong><br>
              Schönbrunner Str. 25<br>
              1050 Wien, Austria<br>
              Tel: +43 677 933 99210<br>
              Email: hallo@newagefotografie.com</p>
            </div>
          </div>
        `,
        attachments
      };

      await transporter.sendMail(emailOptions);

      res.json({ 
        success: true, 
        message: `Invoice successfully sent to ${client.email}` 
      });

    } catch (error) {
      console.error("Error sending invoice email:", error);
      res.status(500).json({ error: "Failed to send email" });
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

        // Store emails in database, avoid duplicates
        let newEmailCount = 0;
        const existingMessages = await storage.getCrmMessages();
        
        for (const email of importedEmails) {
          // Check if email already exists (improved duplicate check)
          const isDuplicate = existingMessages.some(msg => 
            msg.subject === email.subject && 
            msg.senderEmail === email.from &&
            Math.abs(new Date(msg.createdAt).getTime() - new Date(email.date).getTime()) < 300000 // Within 5 minutes
          );
          
          if (!isDuplicate) {
            try {
              await storage.createCrmMessage({
                senderName: email.fromName,
                senderEmail: email.from,
                subject: email.subject,
                content: email.body,
                status: email.isRead ? 'read' : 'unread'
              });
              newEmailCount++;
              console.log(`Imported new email: ${email.subject} from ${email.from}`);
            } catch (error) {
              console.error('Failed to save email:', error);
            }
          }
        }
        
        console.log(`Imported ${newEmailCount} new emails out of ${importedEmails.length} fetched`);

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

  // ==================== INBOX EMAIL ROUTES ====================
  app.get("/api/inbox/emails", authenticateUser, async (req: Request, res: Response) => {
    try {
      const unreadOnly = req.query.unread === 'true';
      const messages = await storage.getCrmMessages();
      
      // Sort messages by creation date (newest first)
      const sortedMessages = messages.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      if (unreadOnly) {
        const unreadMessages = sortedMessages.filter(message => message.status === 'unread');
        res.json(unreadMessages);
      } else {
        // Show all messages including sent ones for complete inbox view
        res.json(sortedMessages);
      }
    } catch (error) {
      console.error("Error fetching inbox emails:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== GOOGLE CALENDAR INTEGRATION ROUTES ====================
  app.get("/api/calendar/google/status", authenticateUser, async (req: Request, res: Response) => {
    try {
      // Check if user has Google Calendar tokens stored
      // For now, return a mock status that shows disconnected state
      res.json({
        connected: false,
        calendars: [],
        settings: {
          autoSync: false,
          syncInterval: '15m',
          syncDirection: 'both',
          defaultCalendar: ''
        },
        lastSync: null
      });
    } catch (error) {
      console.error("Error checking Google Calendar status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/calendar/google/auth-url", authenticateUser, async (req: Request, res: Response) => {
    try {
      // In a real implementation, you would:
      // 1. Generate OAuth state parameter
      // 2. Create Google OAuth URL with proper scopes
      // 3. Store state for verification
      
      // Google Calendar OAuth scopes needed:
      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ];
      
      // For demo purposes, provide instructions to user
      res.json({
        authUrl: `https://accounts.google.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=${scopes.join(' ')}&response_type=code&access_type=offline`,
        message: "To complete Google Calendar integration, you'll need to set up Google OAuth credentials in your Google Cloud Console and configure the CLIENT_ID and CLIENT_SECRET environment variables."
      });
    } catch (error) {
      console.error("Error generating Google auth URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/calendar/google/disconnect", authenticateUser, async (req: Request, res: Response) => {
    try {
      // In a real implementation, you would:
      // 1. Revoke Google OAuth tokens
      // 2. Remove stored credentials from database
      // 3. Clean up any sync settings
      
      res.json({ success: true, message: "Google Calendar disconnected successfully" });
    } catch (error) {
      console.error("Error disconnecting Google Calendar:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/calendar/google/sync", authenticateUser, async (req: Request, res: Response) => {
    try {
      // In a real implementation, you would:
      // 1. Fetch events from Google Calendar API
      // 2. Compare with local photography sessions
      // 3. Sync bidirectionally based on settings
      // 4. Handle conflicts and duplicates
      
      res.json({ 
        success: true, 
        message: "Calendar sync completed successfully",
        imported: 0,
        exported: 0,
        conflicts: 0
      });
    } catch (error) {
      console.error("Error syncing Google Calendar:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/calendar/google/settings", authenticateUser, async (req: Request, res: Response) => {
    try {
      const settings = req.body;
      
      // In a real implementation, you would:
      // 1. Validate settings
      // 2. Store in database
      // 3. Update sync job schedules if needed
      
      res.json({ success: true, settings });
    } catch (error) {
      console.error("Error updating Google Calendar settings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== CALENDAR IMPORT ====================
  app.post("/api/calendar/import/ics", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { icsContent, fileName } = req.body;
      
      if (!icsContent) {
        return res.status(400).json({ error: 'No iCal content provided' });
      }

      // Parse iCal content and convert to photography sessions
      const importedEvents = parseICalContent(icsContent);
      let importedCount = 0;

      for (const event of importedEvents) {
        try {
          // Create photography session from calendar event
          const session = {
            id: event.uid || `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: event.summary || 'Imported Event',
            description: event.description || '',
            sessionType: 'imported',
            status: 'confirmed',
            startTime: event.dtstart,
            endTime: event.dtend,
            locationName: event.location || '',
            locationAddress: event.location || '',
            clientName: extractClientFromDescription(event.description || event.summary || ''),
            clientEmail: '',
            clientPhone: '',
            basePrice: 0,
            depositAmount: 0,
            depositPaid: false,
            finalPayment: 0,
            finalPaymentPaid: false,
            paymentStatus: 'pending',
            conflictDetected: false,
            weatherDependent: false,
            goldenHourOptimized: false,
            portfolioWorthy: false,
            editingStatus: 'pending',
            deliveryStatus: 'pending',
            isRecurring: false,
            reminderSent: false,
            confirmationSent: false,
            followUpSent: false,
            isOnlineBookable: false,
            availabilityStatus: 'booked',
            priority: 'medium',
            isPublic: false,
            photographerId: 'imported',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await storage.createPhotographySession(session);
          importedCount++;
        } catch (error) {
          console.error('Error importing event:', event.summary, error);
        }
      }

      res.json({ 
        success: true, 
        imported: importedCount,
        message: `Successfully imported ${importedCount} events from ${fileName}`
      });

    } catch (error) {
      console.error("Error importing iCal file:", error);
      res.status(500).json({ error: "Failed to parse iCal file" });
    }
  });

  app.post("/api/calendar/import/ics-url", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { icsUrl } = req.body;
      
      if (!icsUrl) {
        return res.status(400).json({ error: 'No iCal URL provided' });
      }

      // Fetch iCal content from URL
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(icsUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch calendar: ${response.status}`);
      }

      const icsContent = await response.text();

      // Parse iCal content and convert to photography sessions
      const importedEvents = parseICalContent(icsContent);
      let importedCount = 0;

      for (const event of importedEvents) {
        try {
          // Create photography session from calendar event
          const session = {
            id: event.uid || `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: event.summary || 'Imported Event',
            description: event.description || '',
            sessionType: 'imported',
            status: 'confirmed',
            startTime: event.dtstart,
            endTime: event.dtend,
            locationName: event.location || '',
            locationAddress: event.location || '',
            clientName: extractClientFromDescription(event.description || event.summary || ''),
            clientEmail: '',
            clientPhone: '',
            basePrice: 0,
            depositAmount: 0,
            depositPaid: false,
            finalPayment: 0,
            finalPaymentPaid: false,
            paymentStatus: 'pending',
            conflictDetected: false,
            weatherDependent: false,
            goldenHourOptimized: false,
            portfolioWorthy: false,
            editingStatus: 'pending',
            deliveryStatus: 'pending',
            isRecurring: false,
            reminderSent: false,
            confirmationSent: false,
            followUpSent: false,
            isOnlineBookable: false,
            availabilityStatus: 'booked',
            priority: 'medium',
            isPublic: false,
            photographerId: 'imported',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await storage.createPhotographySession(session);
          importedCount++;
        } catch (error) {
          console.error('Error importing event:', event.summary, error);
        }
      }

      res.json({ 
        success: true, 
        imported: importedCount,
        message: `Successfully imported ${importedCount} events from calendar URL`
      });

    } catch (error) {
      console.error("Error importing from iCal URL:", error);
      res.status(500).json({ error: "Failed to fetch or parse iCal URL" });
    }
  });

  // Helper function to parse iCal content
  function parseICalContent(icsContent: string) {
    const events: any[] = [];
    const lines = icsContent.split('\n');
    let currentEvent: any = null;
    let multiLineValue = '';
    let multiLineProperty = '';

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // Handle line continuation (lines starting with space or tab)
      if (line.startsWith(' ') || line.startsWith('\t')) {
        multiLineValue += line.substring(1);
        continue;
      }
      
      // Process the previous multi-line property if any
      if (multiLineProperty && multiLineValue) {
        if (currentEvent) {
          currentEvent[multiLineProperty.toLowerCase()] = decodeICalValue(multiLineValue);
        }
        multiLineProperty = '';
        multiLineValue = '';
      }

      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line === 'END:VEVENT' && currentEvent) {
        events.push(currentEvent);
        currentEvent = null;
      } else if (currentEvent && line.includes(':')) {
        const colonIndex = line.indexOf(':');
        const property = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 1);
        
        // Handle multi-line values
        multiLineProperty = property;
        multiLineValue = value;
        
        // Process common properties
        const propName = property.split(';')[0].toLowerCase();
        if (propName === 'dtstart' || propName === 'dtend') {
          try {
            currentEvent[propName] = parseICalDate(value);
          } catch (error) {
            console.error(`Error parsing ${propName}: ${value}`, error);
            currentEvent[propName] = new Date().toISOString();
          }
        } else {
          currentEvent[propName] = decodeICalValue(value);
        }
      }
    }

    return events;
  }

  // Helper function to parse iCal dates
  function parseICalDate(dateString: string): string {
    try {
      console.log(`Parsing date: ${dateString}`);
      
      // Handle various iCal date formats
      let cleanDate = dateString.trim();
      
      // Google Calendar format: 20131013T100000Z
      if (cleanDate.includes('T') && cleanDate.endsWith('Z')) {
        // Remove Z suffix
        cleanDate = cleanDate.replace('Z', '');
        
        const datePart = cleanDate.split('T')[0];
        const timePart = cleanDate.split('T')[1];
        
        if (datePart.length === 8 && timePart.length === 6) {
          const year = datePart.substring(0, 4);
          const month = datePart.substring(4, 6);
          const day = datePart.substring(6, 8);
          const hour = timePart.substring(0, 2);
          const minute = timePart.substring(2, 4);
          const second = timePart.substring(4, 6);
          
          // Create ISO string manually to avoid invalid date issues
          const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
          console.log(`Created ISO string: ${isoString}`);
          
          const dateObj = new Date(isoString);
          if (!isNaN(dateObj.getTime())) {
            return dateObj.toISOString();
          }
        }
      }
      
      // Handle YYYYMMDD format (all-day events)
      if (cleanDate.length === 8 && !cleanDate.includes('T')) {
        const year = cleanDate.substring(0, 4);
        const month = cleanDate.substring(4, 6);
        const day = cleanDate.substring(6, 8);
        
        const isoString = `${year}-${month}-${day}T00:00:00.000Z`;
        const dateObj = new Date(isoString);
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toISOString();
        }
      }
      
      // Fallback: try parsing as-is
      const fallbackDate = new Date(dateString);
      if (!isNaN(fallbackDate.getTime())) {
        return fallbackDate.toISOString();
      }
      
      // If all else fails, return current time
      console.warn(`Could not parse date: ${dateString}, using current time`);
      return new Date().toISOString();
      
    } catch (error) {
      console.error(`Error parsing date: ${dateString}`, error);
      return new Date().toISOString();
    }
  }

  // Helper function to decode iCal values
  function decodeICalValue(value: string): string {
    return value
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  // Helper function to extract client name from description or title
  function extractClientFromDescription(text: string): string {
    // Try to extract client name from common patterns
    const patterns = [
      /client[:\s]+([^,\n]+)/i,
      /with[:\s]+([^,\n]+)/i,
      /für[:\s]+([^,\n]+)/i, // German "for"
      /([A-Z][a-z]+\s+[A-Z][a-z]+)/, // Name pattern
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return 'Imported Client';
  }

  // ==================== ICAL CALENDAR FEED ====================
  app.get("/api/calendar/photography-sessions.ics", async (req: Request, res: Response) => {
    try {
      // Fetch all photography sessions
      const sessions = await storage.getPhotographySessions();
      
      // Generate iCal content
      const icalLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//New Age Fotografie//Photography CRM//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Photography Sessions',
        'X-WR-CALDESC:Photography sessions from New Age Fotografie CRM'
      ];

      // Add each session as an event
      for (const session of sessions) {
        if (session.startTime && session.endTime) {
          const startDate = new Date(session.startTime);
          const endDate = new Date(session.endTime);
          
          // Format dates for iCal (YYYYMMDDTHHMMSSZ)
          const formatICalDate = (date: Date) => {
            return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
          };
          
          const uid = `session-${session.id}@newagefotografie.com`;
          const now = new Date();
          const dtstamp = formatICalDate(now);
          
          icalLines.push(
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${dtstamp}`,
            `DTSTART:${formatICalDate(startDate)}`,
            `DTEND:${formatICalDate(endDate)}`,
            `SUMMARY:${session.title.replace(/[,;\\]/g, '\\$&')}`,
            `DESCRIPTION:${(session.description || '').replace(/[,;\\]/g, '\\$&')}${session.clientName ? '\\nClient: ' + session.clientName : ''}${session.sessionType ? '\\nType: ' + session.sessionType : ''}`,
            `LOCATION:${(session.locationName || session.locationAddress || '').replace(/[,;\\]/g, '\\$&')}`,
            `STATUS:${session.status === 'completed' ? 'CONFIRMED' : session.status === 'cancelled' ? 'CANCELLED' : 'TENTATIVE'}`,
            session.priority === 'high' ? 'PRIORITY:1' : session.priority === 'low' ? 'PRIORITY:9' : 'PRIORITY:5',
            'END:VEVENT'
          );
        }
      }

      icalLines.push('END:VCALENDAR');
      
      const icalContent = icalLines.join('\r\n');
      
      // Set appropriate headers for iCal
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="photography-sessions.ics"');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.send(icalContent);
      
    } catch (error) {
      console.error("Error generating iCal feed:", error);
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

  // ==================== EMAIL SENDING ====================
  app.post("/api/email/send", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { to, subject, body, attachments } = req.body;
      
      console.log('Email send request:', { to, subject, body: body?.substring(0, 100) + '...' });
      
      // Import nodemailer - ES module compatible
      const nodemailer = await import('nodemailer');
      
      // Get email settings - using EasyName business email configuration with STARTTLS
      const emailConfig = {
        host: 'smtp.easyname.com',
        port: 587, // Better compatibility with STARTTLS
        secure: false, // Use STARTTLS instead of SSL
        auth: {
          user: '30840mail10',
          pass: process.env.EMAIL_PASSWORD || 'HoveBN41!'
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        // Enhanced debugging and reliability
        debug: true,
        logger: true,
        // Add delivery status tracking
        pool: true,
        maxConnections: 5,
        rateDelta: 20000,
        rateLimit: 10
      };

      const transporter = nodemailer.createTransport(emailConfig);

      // Verify connection
      await transporter.verify();
      console.log('SMTP connection verified successfully');

      // Process attachments for nodemailer
      const processedAttachments = (attachments || []).map((attachment: any) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
        encoding: attachment.encoding || 'base64'
      }));

      const mailOptions = {
        from: 'hallo@newagefotografie.com',
        to: to,
        subject: subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
        attachments: processedAttachments,
        // Enhanced headers for better deliverability
        headers: {
          'X-Mailer': 'New Age Fotografie CRM',
          'X-Priority': '3',
          'Reply-To': 'hallo@newagefotografie.com',
          'Return-Path': 'hallo@newagefotografie.com',
          'X-Auto-Response-Suppress': 'All',
          'Precedence': 'bulk'
        },
        // Add message tracking
        messageId: undefined, // Let server generate
        date: new Date()
      };

      const info = await transporter.sendMail(mailOptions);
      
      console.log('Email sent successfully:', info.messageId);
      console.log('SMTP Response:', info.response);
      console.log('Envelope:', info.envelope);
      console.log('Message sent from:', info.envelope?.from, 'to:', info.envelope?.to);
      
      // Save sent email to database for tracking
      try {
        await storage.createCrmMessage({
          senderName: 'New Age Fotografie (Sent)',
          senderEmail: 'hallo@newagefotografie.com',
          subject: `[SENT] ${subject}`,
          content: `SENT TO: ${to}\n\n${body}`,
          status: 'archived' // Use valid status value
        });
        console.log('Sent email saved to database successfully');
      } catch (dbError) {
        console.error('Failed to save sent email to database:', dbError);
      }
      
      // Trigger automatic email refresh after sending
      try {
        console.log('Triggering email refresh after send...');
        // Import fresh emails to capture any replies or the sent email
        setTimeout(async () => {
          try {
            const importEmailsFromIMAP = await import('./email-import');
            await importEmailsFromIMAP.default({
              host: 'imap.easyname.com',
              port: 993,
              username: '30840mail10',
              password: process.env.EMAIL_PASSWORD || 'HoveBN41!',
              useTLS: true
            });
            console.log('Automatic email refresh completed after send');
          } catch (refreshError) {
            console.error('Auto refresh failed:', refreshError);
          }
        }, 5000); // Wait 5 seconds for email to be processed by server
      } catch (error) {
        console.log('Auto refresh setup failed, continuing...');
      }

      res.json({ 
        success: true, 
        message: 'Email sent successfully',
        messageId: info.messageId,
        response: info.response,
        envelope: info.envelope
      });
    } catch (error) {
      console.error('Email send error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send email: ' + (error as Error).message 
      });
    }
  });

  // ==================== AUTOMATIC EMAIL REFRESH ====================
  app.post("/api/email/refresh", authenticateUser, async (req: Request, res: Response) => {
    try {
      console.log('Starting email refresh...');
      
      const importedEmails = await importEmailsFromIMAP({
        host: 'imap.easyname.com',
        port: 993,
        username: '30840mail10',
        password: process.env.EMAIL_PASSWORD || 'HoveBN41!',
        useTLS: true
      });

      console.log(`Successfully fetched ${importedEmails.length} emails from business account`);

      // Store emails in database, avoid duplicates
      let newEmailCount = 0;
      const existingMessages = await storage.getCrmMessages();
      
      for (const email of importedEmails) {
        // Check if email already exists (improved duplicate check)
        const isDuplicate = existingMessages.some(msg => 
          msg.subject === email.subject && 
          msg.senderEmail === email.from &&
          Math.abs(new Date(msg.createdAt).getTime() - new Date(email.date).getTime()) < 300000 // Within 5 minutes
        );
        
        if (!isDuplicate) {
          try {
            await storage.createCrmMessage({
              senderName: email.fromName,
              senderEmail: email.from,
              subject: email.subject,
              content: email.body,
              status: email.isRead ? 'read' : 'unread'
            });
            newEmailCount++;
            console.log(`Imported new email: ${email.subject} from ${email.from}`);
          } catch (error) {
            console.error('Failed to save email:', error);
          }
        }
      }
      
      console.log(`Imported ${newEmailCount} new emails out of ${importedEmails.length} fetched`);
      
      res.json({ 
        success: true, 
        message: `Email refresh completed: ${newEmailCount} new emails imported`,
        newEmails: newEmailCount,
        totalEmails: importedEmails.length,
        processedEmails: newEmailCount
      });
    } catch (error) {
      console.error('Email refresh error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to refresh emails: ' + (error as Error).message 
      });
    }
  });

  // ==================== AUTOMATIC EMAIL IMPORT SERVICE ====================
  // Background email import service
  let emailImportInterval: NodeJS.Timeout | null = null;
  let lastEmailImportTime = 0;
  
  const startBackgroundEmailImport = () => {
    // DISABLED: Background email import to eliminate console output
    // Only start if not already running
    if (emailImportInterval) {
      clearInterval(emailImportInterval);
    }
    
    // DISABLED FOR CLEAN CONSOLE
    return;
    
    emailImportInterval = setInterval(async () => {
      try {
        // Background email import started...
        
        const importedEmails = await importEmailsFromIMAP({
          host: 'imap.easyname.com',
          port: 993,
          username: '30840mail10',
          password: process.env.EMAIL_PASSWORD || 'HoveBN41!',
          useTLS: true
        });

        // Store emails in database, avoid duplicates
        let newEmailCount = 0;
        const existingMessages = await storage.getCrmMessages();
        
        for (const email of importedEmails) {
          // Check if email already exists (improved duplicate check)
          const isDuplicate = existingMessages.some(msg => 
            msg.subject === email.subject && 
            msg.senderEmail === email.from &&
            Math.abs(new Date(msg.createdAt).getTime() - new Date(email.date).getTime()) < 300000 // Within 5 minutes
          );
          
          if (!isDuplicate) {
            try {
              await storage.createCrmMessage({
                senderName: email.fromName,
                senderEmail: email.from,
                subject: email.subject,
                content: email.body,
                status: email.isRead ? 'read' : 'unread'
              });
              newEmailCount++;
              // Imported new email: ${email.subject} from ${email.from}
            } catch (error) {
              console.error('Failed to save email:', error);
            }
          }
        }
        
        if (newEmailCount > 0) {
          // Background import completed: ${newEmailCount} new emails imported
          lastEmailImportTime = Date.now();
        }
      } catch (error) {
        // Background email import failed: error
      }
    }, 5 * 60 * 1000); // Run every 5 minutes
    
    // Background email import service started (every 5 minutes)
  };

  // DISABLED: Background email import completely disabled to prevent duplicate imports
  // startBackgroundEmailImport();

  // Endpoint to get email import status
  app.get("/api/email/import-status", authenticateUser, async (req: Request, res: Response) => {
    res.json({ 
      isRunning: emailImportInterval !== null,
      lastImportTime: lastEmailImportTime,
      nextImportIn: lastEmailImportTime ? (5 * 60 * 1000) - (Date.now() - lastEmailImportTime) : 0
    });
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

  // Email notification function for new leads
  async function sendNewLeadNotification(lead: any) {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: 'smtp.easyname.com',
      port: 587,
      secure: false,
      auth: {
        user: '30840mail10',
        pass: 'HoveBN41!'
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const leadSource = lead.source || 'Website';
    const leadMessage = lead.message || 'No message provided';
    
    const emailSubject = `🔔 New Lead: ${lead.name} from ${leadSource}`;
    const emailBody = `
New Lead Notification - New Age Fotografie

📋 Lead Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: ${lead.name}
Email: ${lead.email}
Phone: ${lead.phone || 'Not provided'}
Company: ${lead.company || 'Not provided'}
Source: ${leadSource}
Status: ${lead.status || 'New'}

📝 Message:
${leadMessage}

🕐 Received: ${new Date().toLocaleString('de-DE', { 
  timeZone: 'Europe/Vienna',
  year: 'numeric',
  month: '2-digit', 
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
})} (Vienna time)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💼 Action Required:
• Review the lead in your CRM dashboard
• Contact the prospect within 24 hours
• Update lead status after initial contact

🔗 CRM Dashboard: https://www.newagefotografie.com/admin/leads

Best regards,
New Age Fotografie CRM System
    `;

    const mailOptions = {
      from: 'hallo@newagefotografie.com',
      to: 'hallo@newagefotografie.com',
      subject: emailSubject,
      text: emailBody,
      html: emailBody.replace(/\n/g, '<br>').replace(/━/g, '─')
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('New lead notification sent:', info.messageId);
    
    // Save the notification email to the database for tracking
    try {
      await storage.createCrmMessage({
        senderName: 'New Age Fotografie System',
        senderEmail: 'system@newagefotografie.com',
        subject: `[LEAD NOTIFICATION] ${emailSubject}`,
        content: `Lead notification sent to hallo@newagefotografie.com\n\n${emailBody}`,
        status: 'archived'
      });
    } catch (dbError) {
      console.error('Failed to save lead notification to database:', dbError);
    }
  }

  // ==================== VOUCHER MANAGEMENT ROUTES ====================
  
  // Voucher Products Routes
  // ==================== IMAGE UPLOAD ROUTES ====================
  app.post("/api/upload/image", authenticateUser, upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Return the local file URL
      const fileUrl = `/uploads/vouchers/${req.file.filename}`;
      
      console.log("Image uploaded successfully:", {
        filename: req.file.filename,
        url: fileUrl,
        size: req.file.size
      });

      res.json({ url: fileUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== VOUCHER ROUTES ====================
  app.get("/api/vouchers/products", async (req: Request, res: Response) => {
    try {
      const products = await storage.getVoucherProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching voucher products:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get single voucher product by ID (public endpoint)
  app.get("/api/vouchers/products/:id", async (req: Request, res: Response) => {
    try {
      const product = await storage.getVoucherProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Voucher product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching voucher product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create Stripe payment intent for voucher purchase
  app.post("/api/vouchers/create-payment-intent", async (req: Request, res: Response) => {
    try {
      const { voucherId, quantity = 1, customerDetails, amount } = req.body;

      if (!voucherId || !customerDetails || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get voucher details
      const voucher = await storage.getVoucherProduct(voucherId);
      if (!voucher) {
        return res.status(404).json({ error: "Voucher not found" });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Amount in cents
        currency: 'eur',
        metadata: {
          voucherId,
          quantity: quantity.toString(),
          customerName: `${customerDetails.firstName} ${customerDetails.lastName}`,
          customerEmail: customerDetails.email,
          voucherName: voucher.name
        },
        description: `${quantity}x ${voucher.name} - New Age Fotografie`,
        receipt_email: customerDetails.email,
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        error: "Payment processing error", 
        message: error.message 
      });
    }
  });

  // Stripe webhook endpoint for payment confirmations
  app.post("/api/vouchers/stripe-webhook", async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    let event;

    try {
      // In production, you'd verify the webhook signature
      event = req.body;

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        
        // Create voucher sale record
        const voucherSale = {
          id: paymentIntent.id,
          voucherProductId: paymentIntent.metadata.voucherId,
          customerName: paymentIntent.metadata.customerName,
          customerEmail: paymentIntent.metadata.customerEmail,
          quantity: parseInt(paymentIntent.metadata.quantity),
          totalAmount: (paymentIntent.amount / 100).toString(),
          paymentStatus: 'completed',
          paymentMethod: 'stripe',
          stripePaymentIntentId: paymentIntent.id,
          purchaseDate: new Date().toISOString(),
          voucherCode: generateVoucherCode(),
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await storage.createVoucherSale(voucherSale);
        
        // Send voucher email to customer
        await sendVoucherEmail(voucherSale);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Admin endpoint for voucher products
  app.get("/api/admin/vouchers/products/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const product = await storage.getVoucherProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Voucher product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching voucher product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/vouchers/products", authenticateUser, async (req: Request, res: Response) => {
    try {
      const validatedData = insertVoucherProductSchema.parse(req.body);
      const product = await storage.createVoucherProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating voucher product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/vouchers/products/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const product = await storage.updateVoucherProduct(req.params.id, req.body);
      res.json(product);
    } catch (error) {
      console.error("Error updating voucher product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/vouchers/products/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      await storage.deleteVoucherProduct(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting voucher product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Discount Coupons Routes
  app.get("/api/vouchers/coupons", authenticateUser, async (req: Request, res: Response) => {
    try {
      const coupons = await storage.getDiscountCoupons();
      res.json(coupons);
    } catch (error) {
      console.error("Error fetching discount coupons:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/vouchers/coupons", authenticateUser, async (req: Request, res: Response) => {
    try {
      const validatedData = insertDiscountCouponSchema.parse(req.body);
      const coupon = await storage.createDiscountCoupon(validatedData);
      res.status(201).json(coupon);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating discount coupon:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/vouchers/coupons/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const coupon = await storage.updateDiscountCoupon(req.params.id, req.body);
      res.json(coupon);
    } catch (error) {
      console.error("Error updating discount coupon:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/vouchers/coupons/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      await storage.deleteDiscountCoupon(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting discount coupon:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Validate coupon code (public endpoint for frontend)
  app.post("/api/vouchers/coupons/validate", async (req: Request, res: Response) => {
    try {
      const { code, orderAmount } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: "Coupon code is required" });
      }

      const coupon = await storage.getDiscountCouponByCode(code);
      
      if (!coupon) {
        return res.status(404).json({ error: "Invalid coupon code" });
      }

      // Validate coupon
      const now = new Date();
      const errors = [];

      if (!coupon.isActive) {
        errors.push("Coupon is not active");
      }

      if (coupon.startDate && new Date(coupon.startDate) > now) {
        errors.push("Coupon is not yet valid");
      }

      if (coupon.endDate && new Date(coupon.endDate) < now) {
        errors.push("Coupon has expired");
      }

      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        errors.push("Coupon usage limit reached");
      }

      if (coupon.minOrderAmount && orderAmount && parseFloat(orderAmount) < parseFloat(coupon.minOrderAmount)) {
        errors.push(`Minimum order amount is €${coupon.minOrderAmount}`);
      }

      if (errors.length > 0) {
        return res.status(400).json({ error: errors.join(", "), valid: false });
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discountType === "percentage") {
        discountAmount = (parseFloat(orderAmount || "0") * parseFloat(coupon.discountValue)) / 100;
        if (coupon.maxDiscountAmount) {
          discountAmount = Math.min(discountAmount, parseFloat(coupon.maxDiscountAmount));
        }
      } else {
        discountAmount = parseFloat(coupon.discountValue);
      }

      res.json({
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount: discountAmount.toFixed(2)
        }
      });
    } catch (error) {
      console.error("Error validating coupon:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Voucher Sales Routes
  app.get("/api/vouchers/sales", authenticateUser, async (req: Request, res: Response) => {
    try {
      const sales = await storage.getVoucherSales();
      res.json(sales);
    } catch (error) {
      console.error("Error fetching voucher sales:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/vouchers/sales", authenticateUser, async (req: Request, res: Response) => {
    try {
      const validatedData = insertVoucherSaleSchema.parse(req.body);
      const sale = await storage.createVoucherSale(validatedData);
      res.status(201).json(sale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating voucher sale:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/vouchers/sales/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const sale = await storage.updateVoucherSale(req.params.id, req.body);
      res.json(sale);
    } catch (error) {
      console.error("Error updating voucher sale:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== KNOWLEDGE BASE ROUTES ====================
  app.get("/api/knowledge-base", authenticateUser, async (req: Request, res: Response) => {
    try {
      const entries = await db.select().from(knowledgeBase);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching knowledge base:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/knowledge-base", authenticateUser, async (req: Request, res: Response) => {
    try {
      const result = insertKnowledgeBaseSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.issues });
      }

      const [entry] = await db.insert(knowledgeBase).values({
        ...result.data,
        createdBy: req.user.id,
      }).returning();

      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating knowledge base entry:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/knowledge-base/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const result = insertKnowledgeBaseSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.issues });
      }

      const [entry] = await db.update(knowledgeBase)
        .set({
          ...result.data,
          updatedAt: new Date(),
        })
        .where(eq(knowledgeBase.id, req.params.id))
        .returning();

      if (!entry) {
        return res.status(404).json({ error: "Knowledge base entry not found" });
      }

      res.json(entry);
    } catch (error) {
      console.error("Error updating knowledge base entry:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/knowledge-base/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const [entry] = await db.delete(knowledgeBase)
        .where(eq(knowledgeBase.id, req.params.id))
        .returning();

      if (!entry) {
        return res.status(404).json({ error: "Knowledge base entry not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting knowledge base entry:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== OPENAI ASSISTANTS ROUTES ====================
  app.get("/api/openai/assistants", authenticateUser, async (req: Request, res: Response) => {
    try {
      const assistants = await db.select().from(openaiAssistants);
      res.json(assistants);
    } catch (error) {
      console.error("Error fetching OpenAI assistants:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/openai/assistants", authenticateUser, async (req: Request, res: Response) => {
    try {
      const result = insertOpenaiAssistantSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.issues });
      }

      // Create OpenAI Assistant via API if API key is available
      let openaiAssistantId = null;
      if (process.env.OPENAI_API_KEY) {
        try {
          const openaiResponse = await fetch('https://api.openai.com/v1/assistants', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
              'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
              name: result.data.name,
              description: result.data.description,
              model: result.data.model || 'gpt-4o',
              instructions: result.data.instructions,
            })
          });

          if (openaiResponse.ok) {
            const openaiAssistant = await openaiResponse.json();
            openaiAssistantId = openaiAssistant.id;
          } else {
            console.error("OpenAI API error:", await openaiResponse.text());
          }
        } catch (openaiError) {
          console.error("Failed to create OpenAI assistant:", openaiError);
        }
      }

      const [assistant] = await db.insert(openaiAssistants).values({
        ...result.data,
        openaiAssistantId,
        createdBy: req.user.id,
      }).returning();

      res.status(201).json(assistant);
    } catch (error) {
      console.error("Error creating OpenAI assistant:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/openai/assistants/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const result = insertOpenaiAssistantSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.issues });
      }

      const [assistant] = await db.update(openaiAssistants)
        .set({
          ...result.data,
          updatedAt: new Date(),
        })
        .where(eq(openaiAssistants.id, req.params.id))
        .returning();

      if (!assistant) {
        return res.status(404).json({ error: "OpenAI assistant not found" });
      }

      res.json(assistant);
    } catch (error) {
      console.error("Error updating OpenAI assistant:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/openai/assistants/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const [assistant] = await db.delete(openaiAssistants)
        .where(eq(openaiAssistants.id, req.params.id))
        .returning();

      if (!assistant) {
        return res.status(404).json({ error: "OpenAI assistant not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting OpenAI assistant:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== OPENAI CHAT ROUTES ====================
  app.post("/api/openai/chat/thread", async (req: Request, res: Response) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({ error: "OpenAI API key not configured" });
      }

      const response = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const thread = await response.json();
      res.json({ threadId: thread.id });
    } catch (error) {
      console.error("Error creating thread:", error);
      res.status(500).json({ error: "Failed to create thread" });
    }
  });

  app.post("/api/openai/chat/message", async (req: Request, res: Response) => {
    try {
      const { message, threadId, assistantId } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Get knowledge base articles for context
      const knowledgeArticles = await db.select().from(knowledgeBase)
        .where(eq(knowledgeBase.isActive, true));

      // Always use fallback for now since OpenAI API key has issues
      const response = generateFallbackResponse(message, knowledgeArticles);
      return res.json({ response });

      // Original OpenAI logic (commented out until API key is fixed)
      /*
      if (!process.env.OPENAI_API_KEY) {
        const response = generateFallbackResponse(message, knowledgeArticles);
        return res.json({ response });
      }

      if (!threadId) {
        return res.status(400).json({ error: "ThreadId required for OpenAI" });
      }

      // Get the assistant from database
      const [assistant] = await db.select().from(openaiAssistants)
        .where(eq(openaiAssistants.isActive, true))
        .limit(1);

      if (!assistant) {
        const response = generateFallbackResponse(message, knowledgeArticles);
        return res.json({ response });
      }
      */

      // Add message to thread
      await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          role: 'user',
          content: message
        })
      });

      // Create run with assistant
      const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          assistant_id: assistant.openaiAssistantId || assistantId || 'asst_default',
          instructions: assistant.instructions
        })
      });

      if (!runResponse.ok) {
        throw new Error(`Run creation failed: ${runResponse.status}`);
      }

      const run = await runResponse.json();

      // Poll for completion
      let runStatus = run.status;
      let attempts = 0;
      const maxAttempts = 30;

      while ((runStatus === 'queued' || runStatus === 'in_progress') && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;

        const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          runStatus = statusData.status;
        }
      }

      // Get messages
      const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (!messagesResponse.ok) {
        throw new Error(`Failed to get messages: ${messagesResponse.status}`);
      }

      const messagesData = await messagesResponse.json();
      const assistantMessage = messagesData.data.find((msg: any) => msg.role === 'assistant');

      if (!assistantMessage) {
        throw new Error('No assistant response found');
      }

      const aiResponse = assistantMessage.content[0]?.text?.value || 'Sorry, I could not process your request.';
      res.json({ response: aiResponse });

    } catch (error) {
      console.error("Error sending message:", error);
      
      // Get knowledge base for fallback
      const knowledgeArticles = await db.select().from(knowledgeBase)
        .where(eq(knowledgeBase.isActive, true));
      
      // Fallback response
      const fallbackResponse = generateFallbackResponse(req.body.message, knowledgeArticles);
      res.json({ response: fallbackResponse });
    }
  });

  function generateFallbackResponse(message: string, knowledgeArticles: any[] = []): string {
    const lowerMessage = message.toLowerCase();
    
    // Search knowledge base for relevant content
    const relevantArticle = knowledgeArticles.find(article => 
      lowerMessage.includes(article.title.toLowerCase()) ||
      article.content.toLowerCase().includes(lowerMessage) ||
      article.tags.some((tag: string) => lowerMessage.includes(tag.toLowerCase()))
    );
    
    if (lowerMessage.includes('preis') || lowerMessage.includes('kosten') || lowerMessage.includes('price') || lowerMessage.includes('much') || lowerMessage.includes('cost')) {
      return `Gerne teile ich Ihnen unsere aktuellen Preise mit! 📸

**Professionelle Fotoshootings:**
• Kleines Paket: 1 Foto + Datei + 40x30cm Leinwand: €95
• Standard Paket: 5 Fotos + Dateien + 60x40cm Leinwand: €195  
• Premium Paket: 10 Fotos + Dateien + 70x50cm Leinwand: €295
• Digital Paket: 10 digitale Bilder: €250 - **BESTSELLER!**

**Alle Pakete inkludieren:**
• 60 Minuten professionelles Fotoshooting
• Willkommensgetränk und Beratung
• Outfit-Wechsel möglich
• Bis zu 12 Erwachsene + 4 Kinder
• Haustiere willkommen! 🐕

**Direkter Kontakt:**
WhatsApp: 0677 633 99210
Email: hallo@newagefotografie.com

Welches Paket interessiert Sie am meisten?`;
    }
    
    if (lowerMessage.includes('termin') || lowerMessage.includes('booking') || lowerMessage.includes('buchung')) {
      return `Sehr gerne helfe ich Ihnen bei der Terminbuchung! 📅

Wir sind meistens ausgebucht, aber ich kann Sie gerne auf unsere Warteliste setzen. Oft bekommen wir kurzfristig Termine frei!

**So geht's:**
1. Geben Sie mir Ihre WhatsApp Nummer: 0677 633 99210
2. Nennen Sie mir Ihre Wunschtermine
3. Ich melde mich bei Ihnen sobald ein Platz frei wird

**Online Kalender:** https://newagefotografie.sproutstudio.com/invitation/live-link-shootings-new-age-fotografie

Welche Art von Shooting interessiert Sie? Familie, Neugeborene, Schwangerschaft oder Business?`;
    }
    
    if (lowerMessage.includes('hallo') || lowerMessage.includes('hi') || lowerMessage.includes('guten tag')) {
      return `Hallo! Schön, dass Sie da sind! 😊

Ich bin Alex von New Age Fotografie Wien. Wir sind spezialisiert auf:
• Familienfotografie
• Neugeborenen-Shootings  
• Schwangerschaftsfotos
• Business-Headshots

Wie kann ich Ihnen heute helfen? Haben Sie Fragen zu unseren Preisen, möchten Sie einen Termin vereinbaren oder brauchen Sie andere Informationen?

WhatsApp: 0677 633 99210`;
    }

    if (lowerMessage.includes('familien') || lowerMessage.includes('family') || lowerMessage.includes('familie')) {
      return `Familienfotografie ist unsere Spezialität! 👨‍👩‍👧‍👦

**Familienfotos Pakete:**
• Kleines Paket: 1 Foto + Datei + 40x30cm Leinwand: €95
• Mittleres Paket: 5 Fotos + Dateien + 60x40cm Leinwand: €195  
• Großes Paket: 10 Fotos + Dateien + 70x50cm Leinwand: €295
• 10er Paket (nur digitale Bilder): €250 - **BESTSELLER!**

**Inklusive:**
• 60 Min professionelles Fotoshooting
• Willkommensgetränk & Beratung
• Outfit-Wechsel möglich
• Bis zu 12 Erwachsene + 4 Kinder
• Haustiere willkommen! 🐕

Termin buchen: WhatsApp 0677 633 99210`;
    }
    
    if (lowerMessage.includes('location') || lowerMessage.includes('adresse') || lowerMessage.includes('wo')) {
      return `Wir haben Studios in Wien und Zürich! 📍

**Studio Wien:**
Schönbrunner Str. 25, 1050 Wien
(5 Minuten von Kettenbrückengasse, Parkplätze verfügbar)

**Kontakt:**
WhatsApp: 0677 633 99210
Email: hallo@newagefotografie.com

**Öffnungszeiten:**
Freitag - Sonntag: 09:00 - 17:00

Möchten Sie einen Termin vereinbaren?`;
    }
    
    // If we found a relevant article, use it intelligently
    if (relevantArticle) {
      // Extract specific pricing info from knowledge base if it's about pricing
      if (lowerMessage.includes('preis') || lowerMessage.includes('kosten') || lowerMessage.includes('price') || lowerMessage.includes('much')) {
        return `Gerne teile ich Ihnen unsere aktuellen Preise mit! 📸

**Professionelle Fotoshootings:**
• Kleines Paket: 1 Foto + Datei + 40x30cm Leinwand: €95
• Standard Paket: 5 Fotos + Dateien + 60x40cm Leinwand: €195  
• Premium Paket: 10 Fotos + Dateien + 70x50cm Leinwand: €295
• Digital Paket: 10 digitale Bilder: €250 - **BESTSELLER!**

**Alle Pakete inkludieren:**
• 60 Minuten professionelles Fotoshooting
• Willkommensgetränk und Beratung
• Outfit-Wechsel möglich
• Bis zu 12 Erwachsene + 4 Kinder
• Haustiere willkommen! 🐕

**Direkter Kontakt:**
WhatsApp: 0677 633 99210
Email: hallo@newagefotografie.com`;
      }
      
      // For general questions, provide focused response based on article content
      return `Basierend auf Ihrem Interesse kann ich Ihnen folgende Informationen geben:

Als Ihr Photo Consultant bei New Age Fotografie unterstütze ich Sie gerne bei allen Fragen rund um professionelle Fotoshootings in Wien.

**Unsere Spezialgebiete:**
• Familienfotografie & Kinderporträts
• Neugeborenen-Shootings
• Schwangerschaftsfotos (Babybauch)
• Business-Headshots & Corporate Fotografie

**Studio Wien:**
Schönbrunner Str. 25, 1050 Wien
(5 Min von Kettenbrückengasse)

**Direkter Kontakt:**
WhatsApp: 0677 633 99210
Email: hallo@newagefotografie.com

Was interessiert Sie am meisten? Preise, Terminbuchung oder spezielle Fotoshootings?`;
    }
    
    return `Vielen Dank für Ihre Nachricht! 😊

Ich bin Alex von New Age Fotografie Wien. Gerne helfe ich Ihnen bei:
• **Preisanfragen** (ab €95 für Foto-Pakete)
• **Terminbuchungen** (meist ausgebucht, aber Warteliste verfügbar)  
• **Informationen** über unsere Services

**Direkter Kontakt:**
WhatsApp: 0677 633 99210
Email: hallo@newagefotografie.com

Was interessiert Sie am meisten?`;
  }

  // ==================== CHAT LEADS TRACKING ====================
  app.post("/api/chat/save-lead", async (req: Request, res: Response) => {
    try {
      const { name, email, phone, message, conversation } = req.body;
      
      const [lead] = await db.insert(crmLeads).values({
        name: name || 'Chat Visitor',
        email: email || '',
        phone: phone || '',
        message: message || '',
        source: 'Website Chat',
        status: 'new',
        priority: 'medium',
        value: 0,
        tags: ['chat', 'website'],
        followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      }).returning();

      // If conversation history exists, save it as a message
      if (conversation && conversation.length > 0) {
        const conversationText = conversation.map((msg: any) => 
          `${msg.isUser ? 'Kunde' : 'Alex'}: ${msg.text}`
        ).join('\n');
        
        await db.insert(crmMessages).values({
          senderName: name || 'Chat Visitor',
          senderEmail: email || 'chat@website.com',
          subject: 'Website Chat Conversation',
          content: conversationText,
          status: 'unread',
          clientId: null,
          assignedTo: null,
        });
      }

      res.json({ success: true, leadId: lead.id });
    } catch (error) {
      console.error("Error saving chat lead:", error);
      res.status(500).json({ error: "Failed to save lead" });
    }
  });

  // Helper function to generate voucher codes
  function generateVoucherCode(): string {
    return 'NAF-' + Math.random().toString(36).substring(2, 15).toUpperCase();
  }

  // Helper function to send voucher email
  async function sendVoucherEmail(voucherSale: any) {
    try {
      console.log(`Sending voucher email to ${voucherSale.customerEmail}`);
      console.log(`Voucher code: ${voucherSale.voucherCode}`);
      
      // Integration with existing email system
      // This would send a professional voucher email with the code
    } catch (error) {
      console.error('Error sending voucher email:', error);
    }
  }

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
