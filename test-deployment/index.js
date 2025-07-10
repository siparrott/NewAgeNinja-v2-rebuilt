// ES Module compatibility shims for Node.js
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Global shims for compatibility
globalThis.__filename = __filename;
globalThis.__dirname = __dirname;
globalThis.require = require;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/scraping-agent.ts
var scraping_agent_exports = {};
__export(scraping_agent_exports, {
  SEOAgent: () => SEOAgent,
  WebsiteScraper: () => WebsiteScraper
});
import { JSDOM } from "jsdom";
import fetch from "node-fetch";
var WebsiteScraper, SEOAgent;
var init_scraping_agent = __esm({
  "server/scraping-agent.ts"() {
    "use strict";
    WebsiteScraper = class {
      static {
        __name(this, "WebsiteScraper");
      }
      static async scrapeWebsite(url) {
        try {
          const response = await fetch(url);
          const html = await response.text();
          const dom = new JSDOM(html);
          const document = dom.window.document;
          const scrapedData = {
            url,
            title: document.title || "",
            metaDescription: document.querySelector('meta[name="description"]')?.getAttribute("content") || "",
            headings: {
              h1: Array.from(document.querySelectorAll("h1")).map((h) => h.textContent || ""),
              h2: Array.from(document.querySelectorAll("h2")).map((h) => h.textContent || ""),
              h3: Array.from(document.querySelectorAll("h3")).map((h) => h.textContent || "")
            },
            content: {
              aboutText: this.extractAboutText(document),
              services: this.extractServices(document),
              contactInfo: this.extractContactInfo(document),
              testimonials: this.extractTestimonials(document),
              socialLinks: this.extractSocialLinks(document)
            },
            images: {
              logo: this.extractLogo(document),
              gallery: this.extractGalleryImages(document),
              hero: this.extractHeroImages(document)
            },
            seoAnalysis: this.analyzeSEO(document)
          };
          return scrapedData;
        } catch (error) {
          console.error("Error scraping website:", error);
          throw new Error(`Failed to scrape website: ${error.message}`);
        }
      }
      static extractAboutText(document) {
        const aboutSelectors = [
          '[class*="about"]',
          '[id*="about"]',
          'section:has(h1:contains("About")), section:has(h2:contains("About"))',
          'p:contains("photographer")',
          'p:contains("photography")'
        ];
        for (const selector of aboutSelectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent) {
            return element.textContent.trim();
          }
        }
        const paragraphs = Array.from(document.querySelectorAll("p")).slice(0, 3).map((p) => p.textContent?.trim()).filter((text2) => text2 && text2.length > 50);
        return paragraphs.join(" ") || "";
      }
      static extractServices(document) {
        const serviceSelectors = [
          '[class*="service"]',
          '[class*="portfolio"]',
          '[class*="offering"]',
          'ul li:contains("photography")',
          'h3:contains("Wedding"), h3:contains("Portrait"), h3:contains("Family")'
        ];
        const services = [];
        for (const selector of serviceSelectors) {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el) => {
            if (el.textContent) {
              services.push(el.textContent.trim());
            }
          });
        }
        return [...new Set(services)].slice(0, 10);
      }
      static extractContactInfo(document) {
        const text2 = document.body.textContent || "";
        const phoneMatch = text2.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        const emailMatch = text2.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const addressMatch = text2.match(/\d+\s+[A-Za-z\s]+,\s*[A-Za-z\s]+,\s*[A-Za-z]{2}\s+\d{5}/);
        return {
          phone: phoneMatch ? phoneMatch[0] : void 0,
          email: emailMatch ? emailMatch[0] : void 0,
          address: addressMatch ? addressMatch[0] : void 0
        };
      }
      static extractTestimonials(document) {
        const testimonialSelectors = [
          '[class*="testimonial"]',
          '[class*="review"]',
          '[class*="quote"]',
          "blockquote"
        ];
        const testimonials = [];
        for (const selector of testimonialSelectors) {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el) => {
            if (el.textContent && el.textContent.length > 20) {
              testimonials.push(el.textContent.trim());
            }
          });
        }
        return testimonials.slice(0, 5);
      }
      static extractSocialLinks(document) {
        const socialLinks = [];
        const links = document.querySelectorAll('a[href*="facebook"], a[href*="instagram"], a[href*="twitter"], a[href*="linkedin"]');
        links.forEach((link) => {
          const href = link.getAttribute("href");
          if (href) {
            socialLinks.push(href);
          }
        });
        return socialLinks;
      }
      static extractLogo(document) {
        const logoSelectors = [
          'img[alt*="logo"]',
          'img[class*="logo"]',
          'img[id*="logo"]',
          "header img:first-child",
          ".navbar img:first-child"
        ];
        for (const selector of logoSelectors) {
          const img = document.querySelector(selector);
          if (img && img.src) {
            return img.src;
          }
        }
        return void 0;
      }
      static extractGalleryImages(document) {
        const gallerySelectors = [
          '[class*="gallery"] img',
          '[class*="portfolio"] img',
          '[class*="work"] img',
          'img[alt*="photography"]'
        ];
        const images = [];
        for (const selector of gallerySelectors) {
          const imgs = document.querySelectorAll(selector);
          imgs.forEach((img) => {
            if (img.src) {
              images.push(img.src);
            }
          });
        }
        return [...new Set(images)].slice(0, 20);
      }
      static extractHeroImages(document) {
        const heroSelectors = [
          "header img",
          '[class*="hero"] img',
          '[class*="banner"] img',
          "img:first-of-type"
        ];
        const images = [];
        for (const selector of heroSelectors) {
          const imgs = document.querySelectorAll(selector);
          imgs.forEach((img) => {
            if (img.src) {
              images.push(img.src);
            }
          });
        }
        return [...new Set(images)].slice(0, 5);
      }
      static analyzeSEO(document) {
        const issues = [];
        const recommendations = [];
        let score = 100;
        const title = document.title;
        if (!title) {
          issues.push("Missing page title");
          score -= 20;
        } else if (title.length < 30 || title.length > 60) {
          issues.push("Title length not optimal (should be 30-60 characters)");
          score -= 10;
        }
        const metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          issues.push("Missing meta description");
          score -= 15;
        } else {
          const content = metaDesc.getAttribute("content") || "";
          if (content.length < 120 || content.length > 160) {
            issues.push("Meta description length not optimal (should be 120-160 characters)");
            score -= 10;
          }
        }
        const h1s = document.querySelectorAll("h1");
        if (h1s.length === 0) {
          issues.push("Missing H1 heading");
          score -= 15;
        } else if (h1s.length > 1) {
          issues.push("Multiple H1 headings found");
          score -= 10;
        }
        const images = document.querySelectorAll("img");
        let imagesWithoutAlt = 0;
        images.forEach((img) => {
          if (!img.getAttribute("alt")) {
            imagesWithoutAlt++;
          }
        });
        if (imagesWithoutAlt > 0) {
          issues.push(`${imagesWithoutAlt} images missing alt text`);
          score -= Math.min(imagesWithoutAlt * 5, 20);
        }
        recommendations.push("Add location-specific keywords to title and headings");
        recommendations.push("Include photography service keywords throughout content");
        recommendations.push("Add structured data for business information");
        recommendations.push("Optimize images with descriptive alt text");
        recommendations.push("Add internal linking between service pages");
        return {
          issues,
          recommendations,
          score: Math.max(score, 0)
        };
      }
    };
    SEOAgent = class {
      static {
        __name(this, "SEOAgent");
      }
      static generateSEORecommendations(scrapedData, location = "Wien") {
        const businessType = "Familienfotograf";
        const services = ["Familienfotografie", "Neugeborenenfotos", "Hochzeitsfotografie", "Portraitfotografie"];
        return {
          title: {
            current: scrapedData.title,
            improved: `${businessType} ${location} | Professionelle Fotografie Services`,
            reasoning: "Includes primary keyword, location, and clear service description for better local SEO"
          },
          metaDescription: {
            current: scrapedData.metaDescription,
            improved: `Professioneller ${businessType} in ${location}. Spezialisiert auf ${services.join(", ")}. Hochwertige Fotografie f\xFCr Ihre besonderen Momente. Jetzt Termin vereinbaren!`,
            reasoning: "Incorporates location, services, and call-to-action within optimal character limit"
          },
          headings: {
            h1: {
              current: scrapedData.headings.h1,
              improved: [`${businessType} in ${location}, dem Sie vertrauen k\xF6nnen`],
              reasoning: "Trust-building language with location and service keywords"
            },
            h2: {
              current: scrapedData.headings.h2,
              improved: [
                `${services[0]} & ${services[1]}`,
                "Preise & Pakete",
                "H\xE4ufige Fragen"
              ],
              reasoning: "Service-focused H2s with FAQ section for better user experience"
            }
          },
          content: {
            aboutSection: {
              current: scrapedData.content.aboutText,
              improved: `Als erfahrener ${businessType} in ${location} bringe ich Ihre wertvollsten Momente zum Leben. Spezialisiert auf ${services.join(", ")} biete ich professionelle Fotografie-Services f\xFCr Familien in ganz Wien und Umgebung.`,
              reasoning: "Emphasizes expertise, location, and specific services while maintaining personal touch"
            },
            servicesSection: {
              current: scrapedData.content.services,
              improved: services.map((service) => `${service} ${location}`),
              reasoning: "Location-specific service descriptions for better local search ranking"
            }
          },
          keywords: {
            primary: [`${businessType} ${location}`, `${services[0]} ${location}`, `${services[1]} ${location}`],
            secondary: ["professionelle Fotografie", "Familienshooting", "Fotostudio Wien", "Babyfotos"],
            location
          }
        };
      }
    };
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminUsers: () => adminUsers,
  availabilityOverrides: () => availabilityOverrides,
  availabilityTemplates: () => availabilityTemplates,
  blogPosts: () => blogPosts,
  bookingForms: () => bookingForms,
  businessInsights: () => businessInsights,
  calendarSyncLogs: () => calendarSyncLogs,
  calendarSyncSettings: () => calendarSyncSettings,
  crmClients: () => crmClients,
  crmInvoiceItems: () => crmInvoiceItems,
  crmInvoicePayments: () => crmInvoicePayments,
  crmInvoices: () => crmInvoices,
  crmLeads: () => crmLeads,
  galleries: () => galleries,
  galleryImages: () => galleryImages,
  insertBlogPostSchema: () => insertBlogPostSchema,
  insertCrmClientSchema: () => insertCrmClientSchema,
  insertCrmInvoiceItemSchema: () => insertCrmInvoiceItemSchema,
  insertCrmInvoiceSchema: () => insertCrmInvoiceSchema,
  insertCrmLeadSchema: () => insertCrmLeadSchema,
  insertGallerySchema: () => insertGallerySchema,
  insertPhotographySessionSchema: () => insertPhotographySessionSchema,
  insertUserSchema: () => insertUserSchema,
  onlineBookings: () => onlineBookings,
  photographySessions: () => photographySessions,
  sessionCommunications: () => sessionCommunications,
  sessionEquipment: () => sessionEquipment,
  sessionTasks: () => sessionTasks,
  studioConfigs: () => studioConfigs,
  templateDefinitions: () => templateDefinitions,
  users: () => users,
  weatherData: () => weatherData
});
import {
  pgTable,
  text,
  integer,
  boolean,
  uuid,
  timestamp,
  decimal,
  jsonb,
  date
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  password: text("password"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatar: text("avatar"),
  isAdmin: boolean("is_admin").default(false),
  studioId: uuid("studio_id"),
  // Links user to their studio
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var studioConfigs = pgTable("studio_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  studioName: text("studio_name").notNull(),
  ownerEmail: text("owner_email").notNull(),
  domain: text("domain"),
  // custom domain if any
  subdomain: text("subdomain").unique(),
  // photographer1.yoursaas.com
  activeTemplate: text("active_template").default("template-01-modern-minimal"),
  // Branding
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#7C3AED"),
  secondaryColor: text("secondary_color").default("#F59E0B"),
  fontFamily: text("font_family").default("Inter"),
  // Business Info
  businessName: text("business_name"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  country: text("country").default("Austria"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  // Social Media
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  twitterUrl: text("twitter_url"),
  // Operating Hours
  openingHours: jsonb("opening_hours"),
  // Features
  enabledFeatures: text("enabled_features").array().default(["gallery", "booking", "blog", "crm"]),
  // SEO
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  // Status
  isActive: boolean("is_active").default(true),
  subscriptionStatus: text("subscription_status").default("trial"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var templateDefinitions = pgTable("template_definitions", {
  id: text("id").primaryKey(),
  // template-01-modern-minimal
  name: text("name").notNull(),
  // "Modern Minimal"
  description: text("description"),
  category: text("category"),
  // "minimal", "artistic", "classic", etc.
  previewImage: text("preview_image"),
  demoUrl: text("demo_url"),
  features: text("features").array(),
  colorScheme: jsonb("color_scheme"),
  isActive: boolean("is_active").default(true),
  isPremium: boolean("is_premium").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  isAdmin: boolean("is_admin").default(true),
  permissions: jsonb("permissions"),
  createdAt: timestamp("created_at").defaultNow()
});
var blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  content: text("content"),
  contentHtml: text("content_html"),
  excerpt: text("excerpt"),
  imageUrl: text("image_url"),
  published: boolean("published").default(false),
  publishedAt: timestamp("published_at"),
  authorId: uuid("author_id").references(() => users.id),
  tags: text("tags").array(),
  metaDescription: text("meta_description"),
  seoTitle: text("seo_title"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var crmClients = pgTable("crm_clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  clientId: text("client_id").unique(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  country: text("country"),
  company: text("company"),
  notes: text("notes"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var crmLeads = pgTable("crm_leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  message: text("message"),
  source: text("source"),
  status: text("status").default("new"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  priority: text("priority").default("medium"),
  tags: text("tags").array(),
  followUpDate: date("follow_up_date"),
  value: decimal("value", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var crmInvoices = pgTable("crm_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: text("invoice_number").unique().notNull(),
  clientId: uuid("client_id").references(() => crmClients.id).notNull(),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("draft"),
  notes: text("notes"),
  termsAndConditions: text("terms_and_conditions"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var crmInvoiceItems = pgTable("crm_invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").references(() => crmInvoices.id, { onDelete: "cascade" }).notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow()
});
var crmInvoicePayments = pgTable("crm_invoice_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").references(() => crmInvoices.id, { onDelete: "cascade" }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").default("bank_transfer"),
  paymentReference: text("payment_reference"),
  paymentDate: date("payment_date").notNull(),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});
var galleries = pgTable("galleries", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  isPublic: boolean("is_public").default(true),
  isPasswordProtected: boolean("is_password_protected").default(false),
  password: text("password"),
  clientId: uuid("client_id").references(() => crmClients.id),
  createdBy: uuid("created_by").references(() => users.id),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var galleryImages = pgTable("gallery_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  galleryId: uuid("gallery_id").references(() => galleries.id, { onDelete: "cascade" }).notNull(),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  title: text("title"),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow()
});
var photographySessions = pgTable("photography_sessions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  sessionType: text("session_type").notNull(),
  status: text("status").default("scheduled"),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  // Client Integration & Attendees
  clientId: text("client_id"),
  // Link to CRM clients
  clientName: text("client_name"),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  attendees: jsonb("attendees"),
  // Array of attendee objects with RSVP status
  // Location & Weather
  locationName: text("location_name"),
  locationAddress: text("location_address"),
  locationCoordinates: text("location_coordinates"),
  weatherDependent: boolean("weather_dependent").default(false),
  goldenHourOptimized: boolean("golden_hour_optimized").default(false),
  backupPlan: text("backup_plan"),
  // Pricing & Payment Status
  basePrice: decimal("base_price", { precision: 10, scale: 2 }),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  depositPaid: boolean("deposit_paid").default(false),
  finalPayment: decimal("final_payment", { precision: 10, scale: 2 }),
  finalPaymentPaid: boolean("final_payment_paid").default(false),
  paymentStatus: text("payment_status").default("unpaid"),
  // unpaid, deposit_paid, fully_paid, refunded
  // Equipment & Workflow
  equipmentList: text("equipment_list").array(),
  crewMembers: text("crew_members").array(),
  conflictDetected: boolean("conflict_detected").default(false),
  notes: text("notes"),
  portfolioWorthy: boolean("portfolio_worthy").default(false),
  editingStatus: text("editing_status").default("not_started"),
  deliveryStatus: text("delivery_status").default("pending"),
  deliveryDate: timestamp("delivery_date", { withTimezone: true }),
  // Recurring Events Support
  isRecurring: boolean("is_recurring").default(false),
  recurrenceRule: text("recurrence_rule"),
  // RRULE format for recurring events
  parentEventId: text("parent_event_id"),
  // For recurring event instances
  // External Calendar Integration
  googleCalendarEventId: text("google_calendar_event_id"),
  icalUid: text("ical_uid"),
  externalCalendarSync: boolean("external_calendar_sync").default(false),
  // Automated Reminders & Notifications
  reminderSettings: jsonb("reminder_settings"),
  // Customizable reminder times
  reminderSent: boolean("reminder_sent").default(false),
  confirmationSent: boolean("confirmation_sent").default(false),
  followUpSent: boolean("follow_up_sent").default(false),
  // Booking & Availability
  isOnlineBookable: boolean("is_online_bookable").default(false),
  bookingRequirements: jsonb("booking_requirements"),
  // Custom fields for booking
  availabilityStatus: text("availability_status").default("available"),
  // available, blocked, tentative
  // Enhanced Display & Organization
  color: text("color"),
  // Custom color for calendar display
  priority: text("priority").default("medium"),
  // low, medium, high, urgent
  isPublic: boolean("is_public").default(false),
  // For client-facing calendar
  category: text("category"),
  // Additional categorization beyond session type
  // Metadata
  galleryId: text("gallery_id"),
  photographerId: text("photographer_id"),
  tags: text("tags").array(),
  customFields: jsonb("custom_fields"),
  // Flexible custom data storage
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});
var sessionEquipment = pgTable("session_equipment", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  equipmentName: text("equipment_name").notNull(),
  equipmentType: text("equipment_type"),
  rentalRequired: boolean("rental_required").default(false),
  rentalCost: decimal("rental_cost", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});
var sessionTasks = pgTable("session_tasks", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  taskType: text("task_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: text("assigned_to"),
  status: text("status").default("pending"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});
var sessionCommunications = pgTable("session_communications", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  communicationType: text("communication_type").notNull(),
  subject: text("subject"),
  content: text("content"),
  sentTo: text("sent_to"),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow(),
  responseReceived: boolean("response_received").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});
var weatherData = pgTable("weather_data", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  forecastDate: timestamp("forecast_date", { withTimezone: true }).notNull(),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  condition: text("condition"),
  precipitationChance: integer("precipitation_chance"),
  windSpeed: decimal("wind_speed", { precision: 5, scale: 2 }),
  goldenHourStart: timestamp("golden_hour_start", { withTimezone: true }),
  goldenHourEnd: timestamp("golden_hour_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});
var businessInsights = pgTable("business_insights", {
  id: text("id").primaryKey(),
  insightType: text("insight_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dataPoint: decimal("data_point", { precision: 15, scale: 2 }),
  dataUnit: text("data_unit"),
  periodStart: timestamp("period_start", { withTimezone: true }),
  periodEnd: timestamp("period_end", { withTimezone: true }),
  category: text("category"),
  priority: text("priority").default("medium"),
  actionable: boolean("actionable").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});
var availabilityTemplates = pgTable("availability_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  photographerId: text("photographer_id").notNull(),
  businessHours: jsonb("business_hours"),
  breakTime: jsonb("break_time"),
  bufferTime: integer("buffer_time").default(30),
  maxSessionsPerDay: integer("max_sessions_per_day").default(3),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});
var availabilityOverrides = pgTable("availability_overrides", {
  id: text("id").primaryKey(),
  photographerId: text("photographer_id").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  overrideType: text("override_type").notNull(),
  title: text("title"),
  description: text("description"),
  customHours: jsonb("custom_hours"),
  isRecurring: boolean("is_recurring").default(false),
  recurrenceRule: text("recurrence_rule"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});
var calendarSyncSettings = pgTable("calendar_sync_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  provider: text("provider").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  calendarId: text("calendar_id"),
  syncEnabled: boolean("sync_enabled").default(true),
  syncDirection: text("sync_direction").default("bidirectional"),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  syncStatus: text("sync_status").default("active"),
  syncErrors: jsonb("sync_errors"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});
var calendarSyncLogs = pgTable("calendar_sync_logs", {
  id: text("id").primaryKey(),
  syncSettingId: text("sync_setting_id").notNull(),
  syncType: text("sync_type").notNull(),
  status: text("status").notNull(),
  eventsProcessed: integer("events_processed").default(0),
  eventsCreated: integer("events_created").default(0),
  eventsUpdated: integer("events_updated").default(0),
  eventsDeleted: integer("events_deleted").default(0),
  errors: jsonb("errors"),
  duration: integer("duration"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});
var bookingForms = pgTable("booking_forms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sessionTypes: text("session_types").array(),
  fields: jsonb("fields"),
  requirements: jsonb("requirements"),
  pricing: jsonb("pricing"),
  availability: jsonb("availability"),
  confirmationMessage: text("confirmation_message"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});
var onlineBookings = pgTable("online_bookings", {
  id: text("id").primaryKey(),
  formId: text("form_id").notNull(),
  sessionId: text("session_id"),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientPhone: text("client_phone"),
  formData: jsonb("form_data"),
  requestedDate: timestamp("requested_date", { withTimezone: true }),
  requestedTime: text("requested_time"),
  sessionType: text("session_type").notNull(),
  status: text("status").default("pending"),
  notes: text("notes"),
  adminNotes: text("admin_notes"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  processedBy: text("processed_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});
var insertPhotographySessionSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  sessionType: z.string(),
  status: z.string().optional(),
  startTime: z.date(),
  endTime: z.date(),
  clientName: z.string().optional(),
  clientEmail: z.string().optional(),
  clientPhone: z.string().optional(),
  locationName: z.string().optional(),
  locationAddress: z.string().optional(),
  locationCoordinates: z.string().optional(),
  basePrice: z.number().optional(),
  depositAmount: z.number().optional(),
  depositPaid: z.boolean().optional(),
  finalPayment: z.number().optional(),
  finalPaymentPaid: z.boolean().optional(),
  equipmentList: z.array(z.string()).optional(),
  crewMembers: z.array(z.string()).optional(),
  weatherDependent: z.boolean().optional(),
  goldenHourOptimized: z.boolean().optional(),
  backupPlan: z.string().optional(),
  notes: z.string().optional(),
  portfolioWorthy: z.boolean().optional(),
  editingStatus: z.string().optional(),
  deliveryStatus: z.string().optional(),
  deliveryDate: z.date().optional(),
  galleryId: z.string().optional(),
  photographerId: z.string().optional(),
  tags: z.array(z.string()).optional()
});
var insertUserSchema = createInsertSchema(users).pick({
  email: true,
  name: true,
  avatar: true
});
var insertBlogPostSchema = createInsertSchema(blogPosts).pick({
  title: true,
  content: true,
  slug: true,
  excerpt: true,
  published: true,
  imageUrl: true,
  tags: true,
  publishedAt: true
});
var insertCrmClientSchema = createInsertSchema(crmClients).pick({
  name: true,
  email: true,
  phone: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  country: true,
  tags: true,
  notes: true,
  source: true,
  lifetime_value: true
});
var insertCrmLeadSchema = createInsertSchema(crmLeads).pick({
  name: true,
  email: true,
  phone: true,
  company: true,
  message: true,
  source: true,
  status: true,
  priority: true,
  tags: true,
  followUpDate: true,
  value: true
});
var insertGallerySchema = createInsertSchema(galleries).pick({
  title: true,
  description: true,
  slug: true,
  coverImage: true,
  isPublished: true,
  tags: true,
  password: true
});
var insertCrmInvoiceSchema = createInsertSchema(crmInvoices).pick({
  invoiceNumber: true,
  clientId: true,
  issueDate: true,
  dueDate: true,
  subtotal: true,
  taxAmount: true,
  total: true,
  status: true,
  notes: true,
  termsAndConditions: true
});
var insertCrmInvoiceItemSchema = createInsertSchema(crmInvoiceItems).pick({
  invoiceId: true,
  description: true,
  quantity: true,
  unitPrice: true,
  taxRate: true,
  sortOrder: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, asc } from "drizzle-orm";
var DatabaseStorage = class {
  static {
    __name(this, "DatabaseStorage");
  }
  // User management
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  async getUserByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }
  async createUser(user) {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }
  async updateUser(id, updates) {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }
  async deleteUser(id) {
    await db.delete(users).where(eq(users.id, id));
  }
  // Blog management
  async getBlogPosts(published) {
    let query = db.select().from(blogPosts);
    if (published !== void 0) {
      query = query.where(eq(blogPosts.published, published));
    }
    return await query.orderBy(desc(blogPosts.createdAt));
  }
  async getBlogPost(id) {
    const result = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    return result[0];
  }
  async getBlogPostBySlug(slug) {
    const result = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
    return result[0];
  }
  async createBlogPost(post) {
    const result = await db.insert(blogPosts).values(post).returning();
    return result[0];
  }
  async updateBlogPost(id, updates) {
    const result = await db.update(blogPosts).set(updates).where(eq(blogPosts.id, id)).returning();
    return result[0];
  }
  async deleteBlogPost(id) {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }
  // CRM Client management
  async getCrmClients() {
    return await db.select().from(crmClients).orderBy(desc(crmClients.createdAt));
  }
  async getCrmClient(id) {
    const result = await db.select().from(crmClients).where(eq(crmClients.id, id)).limit(1);
    return result[0];
  }
  async createCrmClient(client) {
    const result = await db.insert(crmClients).values(client).returning();
    return result[0];
  }
  async updateCrmClient(id, updates) {
    const result = await db.update(crmClients).set(updates).where(eq(crmClients.id, id)).returning();
    return result[0];
  }
  async deleteCrmClient(id) {
    await db.delete(crmClients).where(eq(crmClients.id, id));
  }
  // CRM Lead management
  async getCrmLeads(status) {
    let query = db.select().from(crmLeads);
    if (status && status !== "all") {
      query = query.where(eq(crmLeads.status, status));
    }
    return await query.orderBy(desc(crmLeads.createdAt));
  }
  async getCrmLead(id) {
    const result = await db.select().from(crmLeads).where(eq(crmLeads.id, id)).limit(1);
    return result[0];
  }
  async createCrmLead(lead) {
    const result = await db.insert(crmLeads).values(lead).returning();
    return result[0];
  }
  async updateCrmLead(id, updates) {
    const result = await db.update(crmLeads).set(updates).where(eq(crmLeads.id, id)).returning();
    return result[0];
  }
  async deleteCrmLead(id) {
    await db.delete(crmLeads).where(eq(crmLeads.id, id));
  }
  // Photography Session management
  async getPhotographySessions(photographerId) {
    let query = db.select().from(photographySessions);
    if (photographerId) {
      query = query.where(eq(photographySessions.photographerId, photographerId));
    }
    return await query.orderBy(asc(photographySessions.startTime));
  }
  async getPhotographySession(id) {
    const result = await db.select().from(photographySessions).where(eq(photographySessions.id, id)).limit(1);
    return result[0];
  }
  async createPhotographySession(session) {
    const result = await db.insert(photographySessions).values(session).returning();
    return result[0];
  }
  async updatePhotographySession(id, updates) {
    const result = await db.update(photographySessions).set(updates).where(eq(photographySessions.id, id)).returning();
    return result[0];
  }
  async deletePhotographySession(id) {
    await db.delete(photographySessions).where(eq(photographySessions.id, id));
  }
  // Gallery management
  async getGalleries() {
    return await db.select().from(galleries).orderBy(desc(galleries.createdAt));
  }
  async getGallery(id) {
    const result = await db.select().from(galleries).where(eq(galleries.id, id)).limit(1);
    return result[0];
  }
  async getGalleryBySlug(slug) {
    const result = await db.select().from(galleries).where(eq(galleries.slug, slug)).limit(1);
    return result[0];
  }
  async createGallery(gallery) {
    const result = await db.insert(galleries).values(gallery).returning();
    return result[0];
  }
  async updateGallery(id, updates) {
    const result = await db.update(galleries).set(updates).where(eq(galleries.id, id)).returning();
    return result[0];
  }
  async deleteGallery(id) {
    await db.delete(galleries).where(eq(galleries.id, id));
  }
  // Invoice management
  async getCrmInvoices() {
    const result = await db.select().from(crmInvoices).orderBy(desc(crmInvoices.createdAt));
    return result;
  }
  async getCrmInvoice(id) {
    const result = await db.select().from(crmInvoices).where(eq(crmInvoices.id, id)).limit(1);
    return result[0];
  }
  async createCrmInvoice(invoice) {
    const result = await db.insert(crmInvoices).values(invoice).returning();
    return result[0];
  }
  async updateCrmInvoice(id, updates) {
    const result = await db.update(crmInvoices).set(updates).where(eq(crmInvoices.id, id)).returning();
    return result[0];
  }
  async deleteCrmInvoice(id) {
    await db.delete(crmInvoices).where(eq(crmInvoices.id, id));
  }
  // Invoice Items management
  async getCrmInvoiceItems(invoiceId) {
    const result = await db.select().from(crmInvoiceItems).where(eq(crmInvoiceItems.invoiceId, invoiceId)).orderBy(asc(crmInvoiceItems.sortOrder));
    return result;
  }
  async createCrmInvoiceItems(items) {
    const result = await db.insert(crmInvoiceItems).values(items).returning();
    return result;
  }
  async getCrmInvoicePayments(invoiceId) {
    const result = await db.select().from(crmInvoicePayments).where(eq(crmInvoicePayments.invoiceId, invoiceId)).orderBy(desc(crmInvoicePayments.paymentDate));
    return result;
  }
  async createCrmInvoicePayment(payment) {
    const result = await db.insert(crmInvoicePayments).values(payment).returning();
    return result[0];
  }
  async deleteCrmInvoicePayment(paymentId) {
    await db.delete(crmInvoicePayments).where(eq(crmInvoicePayments.id, paymentId));
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z as z2 } from "zod";
import { createClient } from "@supabase/supabase-js";
var authenticateUser = /* @__PURE__ */ __name(async (req, res, next) => {
  req.user = { id: "550e8400-e29b-41d4-a716-446655440000", email: "admin@example.com", isAdmin: true };
  next();
}, "authenticateUser");
async function registerRoutes(app2) {
  app2.get("/api/users/:id", authenticateUser, async (req, res) => {
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
  app2.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/blog/posts", async (req, res) => {
    try {
      const published = req.query.published === "true" ? true : req.query.published === "false" ? false : void 0;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search;
      const tag = req.query.tag;
      const exclude = req.query.exclude;
      let posts = await storage.getBlogPosts(published);
      if (search) {
        posts = posts.filter(
          (post) => post.title.toLowerCase().includes(search.toLowerCase()) || post.excerpt && post.excerpt.toLowerCase().includes(search.toLowerCase()) || post.content.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (tag && tag !== "all") {
        posts = posts.filter(
          (post) => post.tags && post.tags.includes(tag)
        );
      }
      if (exclude) {
        posts = posts.filter((post) => post.id !== exclude);
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
  app2.get("/api/blog/posts/:slug", async (req, res) => {
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
  app2.post("/api/blog/posts", authenticateUser, async (req, res) => {
    try {
      const postData = {
        ...req.body,
        // Convert publishedAt string to Date if present
        publishedAt: req.body.publishedAt ? new Date(req.body.publishedAt) : null
      };
      delete postData.authorId;
      console.log("Received blog post data:", postData);
      const validatedData = insertBlogPostSchema.parse(postData);
      console.log("Validated blog post data:", validatedData);
      const post = await storage.createBlogPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        console.error("Blog post validation error:", error.errors);
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating blog post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.put("/api/blog/posts/:id", authenticateUser, async (req, res) => {
    try {
      const post = await storage.updateBlogPost(req.params.id, req.body);
      res.json(post);
    } catch (error) {
      console.error("Error updating blog post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.delete("/api/blog/posts/:id", authenticateUser, async (req, res) => {
    try {
      await storage.deleteBlogPost(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/crm/clients", authenticateUser, async (req, res) => {
    try {
      const clients = await storage.getCrmClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching CRM clients:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/crm/clients/:id", authenticateUser, async (req, res) => {
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
  app2.post("/api/crm/clients", authenticateUser, async (req, res) => {
    try {
      const clientData = insertCrmClientSchema.parse(req.body);
      const client = await storage.createCrmClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating CRM client:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.put("/api/crm/clients/:id", authenticateUser, async (req, res) => {
    try {
      const client = await storage.updateCrmClient(req.params.id, req.body);
      res.json(client);
    } catch (error) {
      console.error("Error updating CRM client:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.delete("/api/crm/clients/:id", authenticateUser, async (req, res) => {
    try {
      await storage.deleteCrmClient(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting CRM client:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/crm/leads", authenticateUser, async (req, res) => {
    try {
      const status = req.query.status;
      const leads = await storage.getCrmLeads(status);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching CRM leads:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/crm/leads/:id", authenticateUser, async (req, res) => {
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
  app2.post("/api/public/leads", async (req, res) => {
    try {
      const leadData = insertCrmLeadSchema.parse(req.body);
      const lead = await storage.createCrmLead(leadData);
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating CRM lead:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/crm/leads", authenticateUser, async (req, res) => {
    try {
      const leadData = insertCrmLeadSchema.parse(req.body);
      const lead = await storage.createCrmLead(leadData);
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating CRM lead:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.put("/api/crm/leads/:id", authenticateUser, async (req, res) => {
    try {
      const lead = await storage.updateCrmLead(req.params.id, req.body);
      res.json(lead);
    } catch (error) {
      console.error("Error updating CRM lead:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.delete("/api/crm/leads/:id", authenticateUser, async (req, res) => {
    try {
      await storage.deleteCrmLead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting CRM lead:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/photography/sessions", authenticateUser, async (req, res) => {
    try {
      const photographerId = req.query.photographerId;
      const sessions = await storage.getPhotographySessions(photographerId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching photography sessions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/photography/sessions/:id", authenticateUser, async (req, res) => {
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
  app2.post("/api/photography/sessions", authenticateUser, async (req, res) => {
    try {
      console.log("Received session data:", JSON.stringify(req.body, null, 2));
      const sessionData = {
        ...req.body,
        createdBy: req.user.id,
        photographerId: req.user.id,
        // Convert string dates to Date objects if they're strings
        startTime: req.body.startTime ? new Date(req.body.startTime) : void 0,
        endTime: req.body.endTime ? new Date(req.body.endTime) : void 0
      };
      console.log("Session data with user info:", JSON.stringify(sessionData, null, 2));
      const validatedData = insertPhotographySessionSchema.parse(sessionData);
      const session = await storage.createPhotographySession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        console.log("Validation error details:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating photography session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.put("/api/photography/sessions/:id", authenticateUser, async (req, res) => {
    try {
      const session = await storage.updatePhotographySession(req.params.id, req.body);
      res.json(session);
    } catch (error) {
      console.error("Error updating photography session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.delete("/api/photography/sessions/:id", authenticateUser, async (req, res) => {
    try {
      await storage.deletePhotographySession(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting photography session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/galleries", async (req, res) => {
    try {
      const galleries2 = await storage.getGalleries();
      res.json(galleries2);
    } catch (error) {
      console.error("Error fetching galleries:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/galleries/:slug", async (req, res) => {
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
  app2.post("/api/galleries", authenticateUser, async (req, res) => {
    try {
      const galleryData = { ...req.body, createdBy: req.user.id };
      const validatedData = insertGallerySchema.parse(galleryData);
      const gallery = await storage.createGallery(validatedData);
      res.status(201).json(gallery);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating gallery:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.put("/api/galleries/:id", authenticateUser, async (req, res) => {
    try {
      const gallery = await storage.updateGallery(req.params.id, req.body);
      res.json(gallery);
    } catch (error) {
      console.error("Error updating gallery:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.delete("/api/galleries/:id", authenticateUser, async (req, res) => {
    try {
      await storage.deleteGallery(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting gallery:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/galleries/:slug/auth", async (req, res) => {
    try {
      const { slug } = req.params;
      const { email, firstName, lastName, password } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const gallery = await storage.getGalleryBySlug(slug);
      if (!gallery) {
        return res.status(404).json({ error: "Gallery not found" });
      }
      if (gallery.isPasswordProtected && gallery.password) {
        if (!password) {
          return res.status(401).json({ error: "Password is required" });
        }
        if (password !== gallery.password) {
          return res.status(401).json({ error: "Invalid password" });
        }
      }
      const token = Buffer.from(`${gallery.id}:${email}:${Date.now()}`).toString("base64");
      res.json({ token });
    } catch (error) {
      console.error("Error authenticating gallery access:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/galleries/:slug/images", async (req, res) => {
    try {
      const { slug } = req.params;
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ error: "Authentication token required" });
      }
      const gallery = await storage.getGalleryBySlug(slug);
      if (!gallery) {
        return res.status(404).json({ error: "Gallery not found" });
      }
      const supabaseUrl = "https://gtnwccyxwrevfnbkjvzm.supabase.co";
      const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bndjY3l4d3JldmZuYmtqdnptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDgwMTgsImV4cCI6MjA2NTgyNDAxOH0.MiOeCq2NCD969D_SXQ1wAlheSvRY5h04cUnV0XNuOrc";
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: supabaseImages, error: supabaseError } = await supabase.from("gallery_images").select("*").eq("gallery_id", gallery.id).order("order_index");
      if (!supabaseImages || supabaseImages.length === 0) {
        console.log("No database records found, checking Supabase Storage...");
        const { data: gallerySpecificFiles, error: galleryError } = await supabase.storage.from("galleries").list(`${gallery.id}/display`, { limit: 100 });
        if (!galleryError && gallerySpecificFiles && gallerySpecificFiles.length > 0) {
          console.log(`Found ${gallerySpecificFiles.length} gallery-specific files`);
          const galleryImages3 = gallerySpecificFiles.filter((file) => file.metadata && file.metadata.size > 0).map((file, index) => {
            const { data: { publicUrl } } = supabase.storage.from("galleries").getPublicUrl(`${gallery.id}/display/${file.name}`);
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
              createdAt: file.updated_at || (/* @__PURE__ */ new Date()).toISOString(),
              sizeBytes: file.metadata?.size || 0,
              contentType: file.metadata?.mimetype || "image/jpeg",
              capturedAt: null
            };
          }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          res.json(galleryImages3);
          return;
        }
        const { data: storageFiles, error: storageError } = await supabase.storage.from("images").list("galleries/images", { limit: 100 });
        if (storageError) {
          console.error("Failed to fetch from Supabase Storage:", storageError);
        } else if (storageFiles && storageFiles.length > 0) {
          console.log(`Found ${storageFiles.length} files in shared storage`);
          if (gallery.slug === "pantling-family") {
            const selectedImages = storageFiles.filter((file) => file.metadata && file.metadata.size > 0).filter((file) => {
              return file.metadata.size > 1e5 && // Larger files (likely actual photos)
              (file.name.includes("1751121") || // Files from specific upload session
              file.name.includes("1751126") || // Recent uploads
              file.name.includes("vip690lwu") || // Specific landscape image
              file.name.includes("gde3zjzvvy8"));
            }).slice(0, 6).map((file, index) => {
              const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(`galleries/images/${file.name}`);
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
                createdAt: file.updated_at || (/* @__PURE__ */ new Date()).toISOString(),
                sizeBytes: file.metadata?.size || 0,
                contentType: file.metadata?.mimetype || "image/jpeg",
                capturedAt: null
              };
            }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            if (selectedImages.length > 0) {
              console.log(`Showing ${selectedImages.length} selected images for Pantling Family gallery`);
              res.json(selectedImages);
              return;
            }
          }
          console.log("Skipping shared images for other galleries to maintain separation");
        }
      }
      if (!supabaseImages || supabaseImages.length === 0) {
        const sampleImages = [
          {
            id: "sample-1",
            galleryId: gallery.id,
            filename: "mountain_landscape.jpg",
            originalUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            displayUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
            thumbUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
            title: "Mountain Vista",
            description: "Beautiful mountain landscape captured during golden hour",
            orderIndex: 0,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            sizeBytes: 25e5,
            contentType: "image/jpeg",
            capturedAt: null
          },
          {
            id: "sample-2",
            galleryId: gallery.id,
            filename: "forest_path.jpg",
            originalUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            displayUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
            thumbUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
            title: "Forest Trail",
            description: "Peaceful forest path through autumn trees",
            orderIndex: 1,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            sizeBytes: 23e5,
            contentType: "image/jpeg",
            capturedAt: null
          },
          {
            id: "sample-3",
            galleryId: gallery.id,
            filename: "lake_reflection.jpg",
            originalUrl: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            displayUrl: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
            thumbUrl: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
            title: "Lake Reflection",
            description: "Perfect mirror reflection on a calm mountain lake",
            orderIndex: 2,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            sizeBytes: 28e5,
            contentType: "image/jpeg",
            capturedAt: null
          },
          {
            id: "sample-4",
            galleryId: gallery.id,
            filename: "city_skyline.jpg",
            originalUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            displayUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
            thumbUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
            title: "Urban Evening",
            description: "City skyline illuminated at twilight",
            orderIndex: 3,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            sizeBytes: 26e5,
            contentType: "image/jpeg",
            capturedAt: null
          },
          {
            id: "sample-5",
            galleryId: gallery.id,
            filename: "coastal_sunset.jpg",
            originalUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2156&q=80",
            displayUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
            thumbUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
            title: "Coastal Sunset",
            description: "Golden hour over the ocean coastline",
            orderIndex: 4,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            sizeBytes: 24e5,
            contentType: "image/jpeg",
            capturedAt: null
          }
        ];
        res.json(sampleImages);
        return;
      }
      const images = supabaseImages.map((img) => ({
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
        contentType: img.content_type || "image/jpeg",
        capturedAt: img.captured_at
      }));
      res.json(images);
    } catch (error) {
      console.error("Error fetching gallery images:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/crm/dashboard/metrics", authenticateUser, async (req, res) => {
    try {
      const metrics = {
        avgOrderValue: 150,
        activeUsers: 25,
        bookedRevenue: 5250,
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
  app2.get("/api/crm/invoices", authenticateUser, async (req, res) => {
    try {
      const invoices = await storage.getCrmInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/crm/invoices/:id", authenticateUser, async (req, res) => {
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
  app2.post("/api/crm/invoices", authenticateUser, async (req, res) => {
    try {
      const invoiceData = insertCrmInvoiceSchema.parse(req.body);
      if (!invoiceData.invoiceNumber) {
        const timestamp2 = Date.now();
        invoiceData.invoiceNumber = `INV-${timestamp2}`;
      }
      const invoice = await storage.createCrmInvoice({
        ...invoiceData,
        createdBy: req.user.id
      });
      if (req.body.items && req.body.items.length > 0) {
        const itemsData = req.body.items.map((item, index) => ({
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
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating invoice:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.put("/api/crm/invoices/:id", authenticateUser, async (req, res) => {
    try {
      const invoice = await storage.updateCrmInvoice(req.params.id, req.body);
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.delete("/api/crm/invoices/:id", authenticateUser, async (req, res) => {
    try {
      await storage.deleteCrmInvoice(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/crm/invoices/:invoiceId/payments", authenticateUser, async (req, res) => {
    try {
      const payments = await storage.getCrmInvoicePayments(req.params.invoiceId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/crm/invoices/:invoiceId/payments", authenticateUser, async (req, res) => {
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
  app2.delete("/api/crm/invoices/:invoiceId/payments/:paymentId", authenticateUser, async (req, res) => {
    try {
      await storage.deleteCrmInvoicePayment(req.params.paymentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting payment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.post("/api/scrape-website", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "Website URL is required" });
      }
      const { WebsiteScraper: WebsiteScraper2 } = await Promise.resolve().then(() => (init_scraping_agent(), scraping_agent_exports));
      const scrapedData = await WebsiteScraper2.scrapeWebsite(url);
      res.json(scrapedData);
    } catch (error) {
      console.error("Error scraping website:", error);
      res.status(500).json({ error: "Failed to scrape website" });
    }
  });
  app2.post("/api/generate-seo-recommendations", async (req, res) => {
    try {
      const { scrapedData, location } = req.body;
      if (!scrapedData) {
        return res.status(400).json({ error: "Scraped data is required" });
      }
      const { SEOAgent: SEOAgent2 } = await Promise.resolve().then(() => (init_scraping_agent(), scraping_agent_exports));
      const recommendations = SEOAgent2.generateSEORecommendations(scrapedData, location);
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating SEO recommendations:", error);
      res.status(500).json({ error: "Failed to generate SEO recommendations" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
__name(registerRoutes, "registerRoutes");

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
__name(log, "log");
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
__name(setupVite, "setupVite");
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}
__name(serveStatic, "serveStatic");

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
//# sourceMappingURL=index.js.map
