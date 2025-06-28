import { 
  pgTable, 
  text, 
  serial, 
  integer, 
  boolean, 
  uuid, 
  timestamp, 
  decimal, 
  jsonb,
  date,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Auth Users table (core authentication)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  password: text("password"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatar: text("avatar"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin Users table
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  isAdmin: boolean("is_admin").default(true),
  permissions: jsonb("permissions"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Blog Posts
export const blogPosts = pgTable("blog_posts", {
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
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CRM Clients
export const crmClients = pgTable("crm_clients", {
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
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CRM Leads
export const crmLeads = pgTable("crm_leads", {
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
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CRM Invoices
export const crmInvoices = pgTable("crm_invoices", {
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
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CRM Invoice Items
export const crmInvoiceItems = pgTable("crm_invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").references(() => crmInvoices.id, { onDelete: "cascade" }).notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Gallery Systems
export const galleries = pgTable("galleries", {
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
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const galleryImages = pgTable("gallery_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  galleryId: uuid("gallery_id").references(() => galleries.id, { onDelete: "cascade" }).notNull(),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  title: text("title"),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Photography Session Management System  
export const photographySessions = pgTable("photography_sessions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  sessionType: text("session_type").notNull(),
  status: text("status").default("scheduled"),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  
  // Client Integration & Attendees
  clientId: text("client_id"), // Link to CRM clients
  clientName: text("client_name"),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  attendees: jsonb("attendees"), // Array of attendee objects with RSVP status
  
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
  paymentStatus: text("payment_status").default("unpaid"), // unpaid, deposit_paid, fully_paid, refunded
  
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
  recurrenceRule: text("recurrence_rule"), // RRULE format for recurring events
  parentEventId: text("parent_event_id"), // For recurring event instances
  
  // External Calendar Integration
  googleCalendarEventId: text("google_calendar_event_id"),
  icalUid: text("ical_uid"),
  externalCalendarSync: boolean("external_calendar_sync").default(false),
  
  // Automated Reminders & Notifications
  reminderSettings: jsonb("reminder_settings"), // Customizable reminder times
  reminderSent: boolean("reminder_sent").default(false),
  confirmationSent: boolean("confirmation_sent").default(false),
  followUpSent: boolean("follow_up_sent").default(false),
  
  // Booking & Availability
  isOnlineBookable: boolean("is_online_bookable").default(false),
  bookingRequirements: jsonb("booking_requirements"), // Custom fields for booking
  availabilityStatus: text("availability_status").default("available"), // available, blocked, tentative
  
  // Enhanced Display & Organization
  color: text("color"), // Custom color for calendar display
  priority: text("priority").default("medium"), // low, medium, high, urgent
  isPublic: boolean("is_public").default(false), // For client-facing calendar
  category: text("category"), // Additional categorization beyond session type
  
  // Metadata
  galleryId: text("gallery_id"),
  photographerId: text("photographer_id"),
  tags: text("tags").array(),
  customFields: jsonb("custom_fields"), // Flexible custom data storage
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const sessionEquipment = pgTable("session_equipment", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  equipmentName: text("equipment_name").notNull(),
  equipmentType: text("equipment_type"),
  rentalRequired: boolean("rental_required").default(false),
  rentalCost: decimal("rental_cost", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const sessionTasks = pgTable("session_tasks", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  taskType: text("task_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: text("assigned_to"),
  status: text("status").default("pending"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const sessionCommunications = pgTable("session_communications", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  communicationType: text("communication_type").notNull(),
  subject: text("subject"),
  content: text("content"),
  sentTo: text("sent_to"),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow(),
  responseReceived: boolean("response_received").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const weatherData = pgTable("weather_data", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  forecastDate: timestamp("forecast_date", { withTimezone: true }).notNull(),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  condition: text("condition"),
  precipitationChance: integer("precipitation_chance"),
  windSpeed: decimal("wind_speed", { precision: 5, scale: 2 }),
  goldenHourStart: timestamp("golden_hour_start", { withTimezone: true }),
  goldenHourEnd: timestamp("golden_hour_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const businessInsights = pgTable("business_insights", {
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
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Advanced Calendar Features - Availability Management
export const availabilityTemplates = pgTable("availability_templates", {
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
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const availabilityOverrides = pgTable("availability_overrides", {
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
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// External Calendar Integration
export const calendarSyncSettings = pgTable("calendar_sync_settings", {
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
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const calendarSyncLogs = pgTable("calendar_sync_logs", {
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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Online Booking System
export const bookingForms = pgTable("booking_forms", {
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
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const onlineBookings = pgTable("online_bookings", {
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
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Insert schemas
export const insertPhotographySessionSchema = z.object({
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
  tags: z.array(z.string()).optional(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  name: true,
  avatar: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).pick({
  title: true,
  content: true,
  slug: true,
  excerpt: true,
  status: true,
  featuredImage: true,
  tags: true,
  publishedAt: true,
});

export const insertCrmClientSchema = createInsertSchema(crmClients).pick({
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
  lifetime_value: true,
});

export const insertCrmLeadSchema = createInsertSchema(crmLeads).pick({
  name: true,
  email: true,
  phone: true,
  source: true,
  status: true,
  priority: true,
  budget: true,
  notes: true,
  tags: true,
  eventDate: true,
  eventType: true,
  location: true,
});

export const insertGallerySchema = createInsertSchema(galleries).pick({
  title: true,
  description: true,
  slug: true,
  coverImage: true,
  isPublished: true,
  tags: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPhotographySession = z.infer<typeof insertPhotographySessionSchema>;
export type PhotographySession = typeof photographySessions.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertCrmClient = z.infer<typeof insertCrmClientSchema>;
export type CrmClient = typeof crmClients.$inferSelect;
export type InsertCrmLead = z.infer<typeof insertCrmLeadSchema>;
export type CrmLead = typeof crmLeads.$inferSelect;
export type InsertGallery = z.infer<typeof insertGallerySchema>;
export type Gallery = typeof galleries.$inferSelect;
export type SessionEquipment = typeof sessionEquipment.$inferSelect;
export type SessionTask = typeof sessionTasks.$inferSelect;
export type SessionCommunication = typeof sessionCommunications.$inferSelect;
export type WeatherData = typeof weatherData.$inferSelect;
export type BusinessInsight = typeof businessInsights.$inferSelect;
