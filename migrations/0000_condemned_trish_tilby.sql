CREATE TABLE IF NOT EXISTS "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"is_admin" boolean DEFAULT true,
	"permissions" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "availability_overrides" (
	"id" text PRIMARY KEY NOT NULL,
	"photographer_id" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"override_type" text NOT NULL,
	"title" text,
	"description" text,
	"custom_hours" jsonb,
	"is_recurring" boolean DEFAULT false,
	"recurrence_rule" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "availability_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"photographer_id" text NOT NULL,
	"business_hours" jsonb,
	"break_time" jsonb,
	"buffer_time" integer DEFAULT 30,
	"max_sessions_per_day" integer DEFAULT 3,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text,
	"content_html" text,
	"excerpt" text,
	"image_url" text,
	"published" boolean DEFAULT false,
	"published_at" timestamp,
	"author_id" uuid,
	"tags" text[],
	"meta_description" text,
	"seo_title" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "booking_forms" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"session_types" text[],
	"fields" jsonb,
	"requirements" jsonb,
	"pricing" jsonb,
	"availability" jsonb,
	"confirmation_message" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "business_insights" (
	"id" text PRIMARY KEY NOT NULL,
	"insight_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"data_point" numeric(15, 2),
	"data_unit" text,
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"category" text,
	"priority" text DEFAULT 'medium',
	"actionable" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendar_sync_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"sync_setting_id" text NOT NULL,
	"sync_type" text NOT NULL,
	"status" text NOT NULL,
	"events_processed" integer DEFAULT 0,
	"events_created" integer DEFAULT 0,
	"events_updated" integer DEFAULT 0,
	"events_deleted" integer DEFAULT 0,
	"errors" jsonb,
	"duration" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendar_sync_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"calendar_id" text,
	"sync_enabled" boolean DEFAULT true,
	"sync_direction" text DEFAULT 'bidirectional',
	"last_sync_at" timestamp with time zone,
	"sync_status" text DEFAULT 'active',
	"sync_errors" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "coupon_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid,
	"customer_email" text NOT NULL,
	"order_amount" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) NOT NULL,
	"voucher_sale_id" uuid,
	"used_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"client_id" text,
	"email" text NOT NULL,
	"phone" text,
	"address" text,
	"city" text,
	"state" text,
	"zip" text,
	"country" text,
	"company" text,
	"notes" text,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "crm_clients_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1',
	"unit_price" numeric(10, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_invoice_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" text DEFAULT 'bank_transfer',
	"payment_reference" text,
	"payment_date" date NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" text NOT NULL,
	"client_id" uuid NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'draft',
	"notes" text,
	"terms_and_conditions" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "crm_invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company" text,
	"message" text,
	"source" text,
	"status" text DEFAULT 'new',
	"assigned_to" uuid,
	"priority" text DEFAULT 'medium',
	"tags" text[],
	"follow_up_date" date,
	"value" numeric(10, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_name" text NOT NULL,
	"sender_email" text NOT NULL,
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'unread',
	"client_id" uuid,
	"assigned_to" uuid,
	"replied_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "discount_coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"discount_type" text NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"min_order_amount" numeric(10, 2),
	"max_discount_amount" numeric(10, 2),
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0,
	"usage_limit_per_customer" integer DEFAULT 1,
	"start_date" timestamp,
	"end_date" timestamp,
	"is_active" boolean DEFAULT true,
	"applicable_products" text[],
	"excluded_products" text[],
	"first_time_customers_only" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "discount_coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "galleries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"cover_image" text,
	"is_public" boolean DEFAULT true,
	"is_password_protected" boolean DEFAULT false,
	"password" text,
	"client_id" uuid,
	"created_by" uuid,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "galleries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gallery_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"url" text NOT NULL,
	"title" text,
	"description" text,
	"sort_order" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "online_bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"form_id" text NOT NULL,
	"session_id" text,
	"client_name" text NOT NULL,
	"client_email" text NOT NULL,
	"client_phone" text,
	"form_data" jsonb,
	"requested_date" timestamp with time zone,
	"requested_time" text,
	"session_type" text NOT NULL,
	"status" text DEFAULT 'pending',
	"notes" text,
	"admin_notes" text,
	"processed_at" timestamp with time zone,
	"processed_by" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "photography_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"session_type" text NOT NULL,
	"status" text DEFAULT 'scheduled',
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"client_id" text,
	"client_name" text,
	"client_email" text,
	"client_phone" text,
	"attendees" jsonb,
	"location_name" text,
	"location_address" text,
	"location_coordinates" text,
	"weather_dependent" boolean DEFAULT false,
	"golden_hour_optimized" boolean DEFAULT false,
	"backup_plan" text,
	"base_price" numeric(10, 2),
	"deposit_amount" numeric(10, 2),
	"deposit_paid" boolean DEFAULT false,
	"final_payment" numeric(10, 2),
	"final_payment_paid" boolean DEFAULT false,
	"payment_status" text DEFAULT 'unpaid',
	"equipment_list" text[],
	"crew_members" text[],
	"conflict_detected" boolean DEFAULT false,
	"notes" text,
	"portfolio_worthy" boolean DEFAULT false,
	"editing_status" text DEFAULT 'not_started',
	"delivery_status" text DEFAULT 'pending',
	"delivery_date" timestamp with time zone,
	"is_recurring" boolean DEFAULT false,
	"recurrence_rule" text,
	"parent_event_id" text,
	"google_calendar_event_id" text,
	"ical_uid" text,
	"external_calendar_sync" boolean DEFAULT false,
	"reminder_settings" jsonb,
	"reminder_sent" boolean DEFAULT false,
	"confirmation_sent" boolean DEFAULT false,
	"follow_up_sent" boolean DEFAULT false,
	"is_online_bookable" boolean DEFAULT false,
	"booking_requirements" jsonb,
	"availability_status" text DEFAULT 'available',
	"color" text,
	"priority" text DEFAULT 'medium',
	"is_public" boolean DEFAULT false,
	"category" text,
	"gallery_id" text,
	"photographer_id" text,
	"tags" text[],
	"custom_fields" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session_communications" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"communication_type" text NOT NULL,
	"subject" text,
	"content" text,
	"sent_to" text,
	"sent_at" timestamp with time zone DEFAULT now(),
	"response_received" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session_equipment" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"equipment_name" text NOT NULL,
	"equipment_type" text,
	"rental_required" boolean DEFAULT false,
	"rental_cost" numeric(10, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"task_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"assigned_to" text,
	"status" text DEFAULT 'pending',
	"due_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "studio_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"studio_name" text NOT NULL,
	"owner_email" text NOT NULL,
	"domain" text,
	"subdomain" text,
	"active_template" text DEFAULT 'template-01-modern-minimal',
	"logo_url" text,
	"primary_color" text DEFAULT '#7C3AED',
	"secondary_color" text DEFAULT '#F59E0B',
	"font_family" text DEFAULT 'Inter',
	"business_name" text,
	"address" text,
	"city" text,
	"state" text,
	"zip" text,
	"country" text DEFAULT 'Austria',
	"phone" text,
	"email" text,
	"website" text,
	"facebook_url" text,
	"instagram_url" text,
	"twitter_url" text,
	"opening_hours" jsonb,
	"enabled_features" text[] DEFAULT gallery,booking,blog,crm,
	"meta_title" text,
	"meta_description" text,
	"is_active" boolean DEFAULT true,
	"subscription_status" text DEFAULT 'trial',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "studio_configs_subdomain_unique" UNIQUE("subdomain")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "template_definitions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"preview_image" text,
	"demo_url" text,
	"features" text[],
	"color_scheme" jsonb,
	"is_active" boolean DEFAULT true,
	"is_premium" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"first_name" text,
	"last_name" text,
	"avatar" text,
	"is_admin" boolean DEFAULT false,
	"studio_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "voucher_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"original_price" numeric(10, 2),
	"category" text,
	"session_duration" integer DEFAULT 60,
	"session_type" text,
	"validity_period" integer DEFAULT 365,
	"redemption_instructions" text,
	"terms_and_conditions" text,
	"image_url" text,
	"display_order" integer DEFAULT 0,
	"featured" boolean DEFAULT false,
	"badge" text,
	"is_active" boolean DEFAULT true,
	"stock_limit" integer,
	"max_per_customer" integer DEFAULT 5,
	"slug" text,
	"meta_title" text,
	"meta_description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "voucher_products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "voucher_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"purchaser_name" text NOT NULL,
	"purchaser_email" text NOT NULL,
	"purchaser_phone" text,
	"recipient_name" text,
	"recipient_email" text,
	"gift_message" text,
	"voucher_code" text NOT NULL,
	"original_amount" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"final_amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'EUR',
	"coupon_id" uuid,
	"coupon_code" text,
	"payment_intent_id" text,
	"payment_status" text DEFAULT 'pending',
	"payment_method" text,
	"is_redeemed" boolean DEFAULT false,
	"redeemed_at" timestamp,
	"redeemed_by" uuid,
	"session_id" uuid,
	"valid_from" timestamp DEFAULT now(),
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "voucher_sales_voucher_code_unique" UNIQUE("voucher_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "weather_data" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"forecast_date" timestamp with time zone NOT NULL,
	"temperature" numeric(5, 2),
	"condition" text,
	"precipitation_chance" integer,
	"wind_speed" numeric(5, 2),
	"golden_hour_start" timestamp with time zone,
	"golden_hour_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_coupon_id_discount_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "discount_coupons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_voucher_sale_id_voucher_sales_id_fk" FOREIGN KEY ("voucher_sale_id") REFERENCES "voucher_sales"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_invoice_items" ADD CONSTRAINT "crm_invoice_items_invoice_id_crm_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "crm_invoices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_invoice_payments" ADD CONSTRAINT "crm_invoice_payments_invoice_id_crm_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "crm_invoices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_invoice_payments" ADD CONSTRAINT "crm_invoice_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_invoices" ADD CONSTRAINT "crm_invoices_client_id_crm_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "crm_clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_invoices" ADD CONSTRAINT "crm_invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_messages" ADD CONSTRAINT "crm_messages_client_id_crm_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "crm_clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_messages" ADD CONSTRAINT "crm_messages_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "galleries" ADD CONSTRAINT "galleries_client_id_crm_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "crm_clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "galleries" ADD CONSTRAINT "galleries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_gallery_id_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "galleries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "voucher_sales" ADD CONSTRAINT "voucher_sales_product_id_voucher_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "voucher_products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "voucher_sales" ADD CONSTRAINT "voucher_sales_coupon_id_discount_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "discount_coupons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "voucher_sales" ADD CONSTRAINT "voucher_sales_redeemed_by_crm_clients_id_fk" FOREIGN KEY ("redeemed_by") REFERENCES "crm_clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
