CREATE TABLE IF NOT EXISTS "agent_action_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"studio_id" uuid NOT NULL,
	"user_id" uuid,
	"action_type" text NOT NULL,
	"action_details" jsonb,
	"assistant_id" text,
	"conversation_id" text,
	"success" boolean DEFAULT true,
	"error_message" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"studio_id" uuid NOT NULL,
	"mode" text DEFAULT 'read_only' NOT NULL,
	"authorities" text[] DEFAULT ,
	"invoice_auto_limit" numeric(10, 2) DEFAULT '0',
	"email_send_mode" text DEFAULT 'draft',
	"max_daily_actions" integer DEFAULT 100,
	"require_approval_above" numeric(10, 2) DEFAULT '500',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_base" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"tags" text[] DEFAULT ,
	"is_active" boolean DEFAULT true,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "openai_assistants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"openai_assistant_id" text,
	"name" text NOT NULL,
	"description" text,
	"model" text DEFAULT 'gpt-4o',
	"instructions" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"knowledge_base_ids" text[] DEFAULT ,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "studio_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"studio_id" uuid NOT NULL,
	"smtp_host" text,
	"smtp_port" integer DEFAULT 587,
	"smtp_user" text,
	"smtp_pass_encrypted" text,
	"inbound_email_address" text,
	"default_from_email" text,
	"stripe_account_id" text,
	"stripe_publishable_key" text,
	"stripe_secret_key_encrypted" text,
	"openai_api_key_encrypted" text,
	"default_currency" text DEFAULT 'EUR',
	"timezone" text DEFAULT 'Europe/Vienna',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "studios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"default_currency" text DEFAULT 'EUR',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "studios_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "scheduled_for" timestamp;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "status" text DEFAULT 'DRAFT';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_action_log" ADD CONSTRAINT "agent_action_log_studio_id_studios_id_fk" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_action_log" ADD CONSTRAINT "agent_action_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_policies" ADD CONSTRAINT "ai_policies_studio_id_studios_id_fk" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "openai_assistants" ADD CONSTRAINT "openai_assistants_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "studio_integrations" ADD CONSTRAINT "studio_integrations_studio_id_studios_id_fk" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
