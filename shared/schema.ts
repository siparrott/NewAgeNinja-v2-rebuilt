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
  clientName: text("client_name"),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  locationName: text("location_name"),
  locationAddress: text("location_address"),
  locationCoordinates: text("location_coordinates"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  depositPaid: boolean("deposit_paid").default(false),
  finalPayment: decimal("final_payment", { precision: 10, scale: 2 }),
  finalPaymentPaid: boolean("final_payment_paid").default(false),
  equipmentList: text("equipment_list").array(),
  crewMembers: text("crew_members").array(),
  weatherDependent: boolean("weather_dependent").default(false),
  goldenHourOptimized: boolean("golden_hour_optimized").default(false),
  backupPlan: text("backup_plan"),
  notes: text("notes"),
  portfolioWorthy: boolean("portfolio_worthy").default(false),
  editingStatus: text("editing_status").default("not_started"),
  deliveryStatus: text("delivery_status").default("pending"),
  deliveryDate: timestamp("delivery_date", { withTimezone: true }),
  galleryId: text("gallery_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  photographerId: text("photographer_id"),
  tags: text("tags").array(),
});

export const sessionEquipment = pgTable("session_equipment", {
  clientPhone: text("client_phone"),
  guestCount: integer("guest_count").default(1),
  specialRequests: text("special_requests"),
  
  // Location & Environment
  locationName: text("location_name"),
  locationAddress: text("location_address"),
  locationNotes: text("location_notes"),
  coordinates: text("coordinates"), // lat,lng
  venueType: text("venue_type"), // indoor, outdoor, studio, home, commercial
  backupLocation: text("backup_location"),
  parkingNotes: text("parking_notes"),
  accessRequirements: text("access_requirements"),
  
  // Weather & Timing Optimization
  goldenHourOptimized: boolean("golden_hour_optimized").default(false),
  weatherDependent: boolean("weather_dependent").default(false),
  weatherBackupPlan: text("weather_backup_plan"),
  optimalLightingTime: text("optimal_lighting_time"),
  sunriseTime: text("sunrise_time"),
  sunsetTime: text("sunset_time"),
  
  // Equipment & Resources
  equipmentList: text("equipment_list").array(),
  specialEquipmentNeeded: text("special_equipment_needed").array(),
  equipmentChecklistCompleted: boolean("equipment_checklist_completed").default(false),
  rentalEquipmentNeeded: text("rental_equipment_needed").array(),
  equipmentConflicts: text("equipment_conflicts").array(),
  
  // Team & Crew
  photographerId: uuid("photographer_id").references(() => users.id).notNull(),
  assistantIds: text("assistant_ids").array(),
  makeupArtist: text("makeup_artist"),
  stylist: text("stylist"),
  otherVendors: jsonb("other_vendors"),
  crewInstructions: text("crew_instructions"),
  
  // Shot Planning
  shotList: jsonb("shot_list"),
  moodBoard: text("mood_board").array(), // URLs to inspiration images
  stylePreferences: text("style_preferences"),
  mustHaveShots: text("must_have_shots").array(),
  shotListApproved: boolean("shot_list_approved").default(false),
  
  // Pricing & Business
  packageType: text("package_type"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }),
  additionalCosts: jsonb("additional_costs"),
  totalEstimate: decimal("total_estimate", { precision: 10, scale: 2 }),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  depositPaid: boolean("deposit_paid").default(false),
  paymentStatus: text("payment_status").default("pending"),
  
  // Client Communication
  communicationPreferences: jsonb("communication_preferences"),
  remindersSent: jsonb("reminders_sent"),
  lastClientContact: timestamp("last_client_contact"),
  clientPreparationChecklist: text("client_preparation_checklist").array(),
  outfitSuggestions: text("outfit_suggestions"),
  
  // Post-Session Workflow
  deliveryDeadline: timestamp("delivery_deadline"),
  editingNotes: text("editing_notes"),
  editingStatus: text("editing_status").default("not-started"), // not-started, in-progress, review, completed
  deliveryMethod: text("delivery_method"), // gallery, usb, cloud, prints
  clientGalleryUrl: text("client_gallery_url"),
  finalDeliveryDate: timestamp("final_delivery_date"),
  
  // Portfolio & Marketing
  portfolioWorthy: boolean("portfolio_worthy").default(false),
  marketingPermissions: jsonb("marketing_permissions"),
  socialMediaApproved: boolean("social_media_approved").default(false),
  testimonialRequested: boolean("testimonial_requested").default(false),
  
  // Business Intelligence
  profitability: decimal("profitability", { precision: 10, scale: 2 }),
  timeInvested: integer("time_invested"), // total hours
  expenseTracker: jsonb("expense_tracker"),
  portfolioGapsFilled: text("portfolio_gaps_filled").array(),
  
  // System Fields
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastModifiedBy: uuid("last_modified_by").references(() => users.id),
  
  // Integration Fields
  calendarSynced: boolean("calendar_synced").default(false),
  googleCalendarEventId: text("google_calendar_event_id"),
  appleiCalEventId: text("apple_ical_event_id"),
  outlookEventId: text("outlook_event_id"),
});

export const sessionEquipment = pgTable("session_equipment", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => photographySessions.id, { onDelete: "cascade" }).notNull(),
  equipmentType: text("equipment_type").notNull(), // camera, lens, lighting, tripod, flash, etc.
  equipmentName: text("equipment_name").notNull(),
  isOwned: boolean("is_owned").default(true),
  rentalSource: text("rental_source"),
  rentalCost: decimal("rental_cost", { precision: 10, scale: 2 }),
  isAvailable: boolean("is_available").default(true),
  conflictingSessions: text("conflicting_sessions").array(),
  checkoutTime: timestamp("checkout_time"),
  checkinTime: timestamp("checkin_time"),
  condition: text("condition").default("good"),
  notes: text("notes"),
});

export const sessionTasks = pgTable("session_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => photographySessions.id, { onDelete: "cascade" }).notNull(),
  taskType: text("task_type").notNull(), // pre-session, during-session, post-session
  taskName: text("task_name").notNull(),
  description: text("description"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  priority: text("priority").default("medium"), // low, medium, high, urgent
  estimatedTime: integer("estimated_time"), // in minutes
  actualTime: integer("actual_time"),
  dependencies: text("dependencies").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessionCommunications = pgTable("session_communications", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => photographySessions.id, { onDelete: "cascade" }).notNull(),
  communicationType: text("communication_type").notNull(), // email, phone, text, in-person, calendar-invite
  direction: text("direction").notNull(), // inbound, outbound
  subject: text("subject"),
  content: text("content"),
  recipientEmail: text("recipient_email"),
  recipientPhone: text("recipient_phone"),
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  respondedAt: timestamp("responded_at"),
  automated: boolean("automated").default(false),
  templateUsed: text("template_used"),
  attachments: text("attachments").array(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const weatherData = pgTable("weather_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => photographySessions.id, { onDelete: "cascade" }).notNull(),
  forecastDate: timestamp("forecast_date").notNull(),
  temperature: integer("temperature"),
  humidity: integer("humidity"),
  cloudCover: integer("cloud_cover"),
  precipitation: decimal("precipitation", { precision: 5, scale: 2 }),
  windSpeed: integer("wind_speed"),
  windDirection: text("wind_direction"),
  visibility: integer("visibility"),
  uvIndex: integer("uv_index"),
  weatherCondition: text("weather_condition"),
  isOptimal: boolean("is_optimal").default(false),
  rescheduleSuggested: boolean("reschedule_suggested").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const businessInsights = pgTable("business_insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  photographerId: uuid("photographer_id").references(() => users.id).notNull(),
  insightType: text("insight_type").notNull(), // booking-pattern, pricing-opportunity, equipment-usage, etc.
  title: text("title").notNull(),
  description: text("description"),
  data: jsonb("data"),
  actionable: boolean("actionable").default(true),
  priority: text("priority").default("medium"),
  implemented: boolean("implemented").default(false),
  generatedAt: timestamp("generated_at").defaultNow(),
  validUntil: timestamp("valid_until"),
  category: text("category"), // financial, operational, marketing, equipment
});

// Messages/Email System
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromEmail: text("from_email").notNull(),
  toEmail: text("to_email").notNull(),
  subject: text("subject"),
  body: text("body"),
  threadId: uuid("thread_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Newsletter System
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  status: text("status").default("active"),
  source: text("source"),
  tags: text("tags").array(),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
});

// Stripe Integration
export const stripeCustomers = pgTable("stripe_customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  stripeCustomerId: text("stripe_customer_id").unique().notNull(),
  email: text("email").notNull(),
  name: text("name"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const stripeOrders = pgTable("stripe_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  stripeSessionId: text("stripe_session_id").unique().notNull(),
  customerId: uuid("customer_id").references(() => stripeCustomers.id),
  status: text("status").default("pending"),
  amountTotal: integer("amount_total").notNull(),
  currency: text("currency").default("usd"),
  productName: text("product_name"),
  voucherType: text("voucher_type"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Import Logs
export const importLogs = pgTable("import_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: text("filename").notNull(),
  importedBy: uuid("imported_by").references(() => users.id),
  rowsProcessed: integer("rows_processed").default(0),
  rowsSuccess: integer("rows_success").default(0),
  rowsError: integer("rows_error").default(0),
  errorFileUrl: text("error_file_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).pick({
  title: true,
  slug: true,
  content: true,
  contentHtml: true,
  excerpt: true,
  imageUrl: true,
  published: true,
  tags: true,
  metaDescription: true,
  seoTitle: true,
});

export const insertCrmClientSchema = createInsertSchema(crmClients).pick({
  firstName: true,
  lastName: true,
  clientId: true,
  email: true,
  phone: true,
  address: true,
  city: true,
  state: true,
  zip: true,
  country: true,
  company: true,
  notes: true,
  status: true,
});

export const insertCrmLeadSchema = createInsertSchema(crmLeads).pick({
  name: true,
  email: true,
  phone: true,
  company: true,
  message: true,
  source: true,
  status: true,
  priority: true,
  tags: true,
  value: true,
});

export const insertPhotographySessionSchema = createInsertSchema(photographySessions).pick({
  title: true,
  description: true,
  sessionType: true,
  status: true,
  startTime: true,
  endTime: true,
  timezone: true,
  duration: true,
  setupTime: true,
  travelTime: true,
  clientId: true,
  clientName: true,
  clientEmail: true,
  clientPhone: true,
  guestCount: true,
  specialRequests: true,
  locationName: true,
  locationAddress: true,
  locationNotes: true,
  coordinates: true,
  venueType: true,
  backupLocation: true,
  parkingNotes: true,
  accessRequirements: true,
  goldenHourOptimized: true,
  weatherDependent: true,
  weatherBackupPlan: true,
  optimalLightingTime: true,
  equipmentList: true,
  specialEquipmentNeeded: true,
  packageType: true,
  basePrice: true,
  depositAmount: true,
  shotList: true,
  moodBoard: true,
  stylePreferences: true,
  mustHaveShots: true,
  deliveryDeadline: true,
  editingNotes: true,
  deliveryMethod: true,
});

export const insertGallerySchema = createInsertSchema(galleries).pick({
  title: true,
  slug: true,
  description: true,
  coverImage: true,
  isPublic: true,
  isPasswordProtected: true,
  password: true,
  clientId: true,
  sortOrder: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type CrmClient = typeof crmClients.$inferSelect;
export type InsertCrmClient = z.infer<typeof insertCrmClientSchema>;
export type CrmLead = typeof crmLeads.$inferSelect;
export type InsertCrmLead = z.infer<typeof insertCrmLeadSchema>;
export type PhotographySession = typeof photographySessions.$inferSelect;
export type InsertPhotographySession = z.infer<typeof insertPhotographySessionSchema>;
export type SessionEquipment = typeof sessionEquipment.$inferSelect;
export type SessionTask = typeof sessionTasks.$inferSelect;
export type SessionCommunication = typeof sessionCommunications.$inferSelect;
export type WeatherData = typeof weatherData.$inferSelect;
export type BusinessInsight = typeof businessInsights.$inferSelect;
export type Gallery = typeof galleries.$inferSelect;
export type InsertGallery = z.infer<typeof insertGallerySchema>;
