-- Photography CRM Schema Migration to Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar TEXT,
    is_admin BOOLEAN DEFAULT false,
    studio_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Studio Configs table
CREATE TABLE studio_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studio_name TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    domain TEXT,
    subdomain TEXT UNIQUE,
    active_template TEXT DEFAULT 'template-01-modern-minimal',
    
    -- Branding
    logo_url TEXT,
    primary_color TEXT DEFAULT '#7C3AED',
    secondary_color TEXT DEFAULT '#F59E0B',
    font_family TEXT DEFAULT 'Inter',
    
    -- Business Info
    business_name TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    country TEXT DEFAULT 'Austria',
    phone TEXT,
    email TEXT,
    website TEXT,
    
    -- Social Media
    facebook_url TEXT,
    instagram_url TEXT,
    twitter_url TEXT,
    
    -- Operating Hours (JSON)
    opening_hours JSONB,
    
    -- Features (array)
    enabled_features TEXT[] DEFAULT ARRAY['gallery', 'booking', 'blog', 'crm'],
    
    -- SEO
    meta_title TEXT,
    meta_description TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    subscription_status TEXT DEFAULT 'trial',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Photography Sessions table
CREATE TABLE photography_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID,
    session_type TEXT,
    session_date TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    location TEXT,
    notes TEXT,
    price DECIMAL(10,2),
    deposit_required DECIMAL(10,2),
    equipment_needed TEXT[],
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CRM Clients table
CREATE TABLE crm_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    country TEXT,
    notes TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Blog Posts table
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    featured_image TEXT,
    status TEXT DEFAULT 'draft',
    published_at TIMESTAMP WITH TIME ZONE,
    author_id UUID,
    tags TEXT[],
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Galleries table
CREATE TABLE galleries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    password TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Gallery Images table
CREATE TABLE gallery_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_name TEXT,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE users ADD CONSTRAINT fk_users_studio_id FOREIGN KEY (studio_id) REFERENCES studio_configs(id);
ALTER TABLE photography_sessions ADD CONSTRAINT fk_sessions_client_id FOREIGN KEY (client_id) REFERENCES crm_clients(id);
ALTER TABLE blog_posts ADD CONSTRAINT fk_blog_posts_author_id FOREIGN KEY (author_id) REFERENCES users(id);

-- Create Row Level Security policies (important for multi-tenant)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE photography_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (you can customize these later)
-- Allow users to see their own studio data
CREATE POLICY "Users can view own studio data" ON studio_configs
    FOR SELECT USING (auth.uid()::text = owner_email OR id = (SELECT studio_id FROM users WHERE id = auth.uid()));

-- Allow authenticated users to view published blog posts
CREATE POLICY "Anyone can view published blog posts" ON blog_posts
    FOR SELECT USING (status = 'published');

-- Allow authenticated users to view public galleries
CREATE POLICY "Anyone can view public galleries" ON galleries
    FOR SELECT USING (is_public = true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_studio_configs_updated_at BEFORE UPDATE ON studio_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_photography_sessions_updated_at BEFORE UPDATE ON photography_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_clients_updated_at BEFORE UPDATE ON crm_clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_galleries_updated_at BEFORE UPDATE ON galleries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO crm_clients (id, first_name, last_name, email, phone, status) VALUES 
    (uuid_generate_v4(), 'John', 'Doe', 'john@example.com', '+1234567890', 'active'),
    (uuid_generate_v4(), 'Jane', 'Smith', 'jane@example.com', '+1234567891', 'active');

INSERT INTO photography_sessions (id, session_type, session_date, duration_minutes, location, status) VALUES 
    (uuid_generate_v4(), 'Wedding', NOW() + INTERVAL '7 days', 480, 'Vienna, Austria', 'scheduled'),
    (uuid_generate_v4(), 'Portrait', NOW() + INTERVAL '14 days', 120, 'Studio', 'scheduled');

-- Success message
SELECT 'Photography CRM schema created successfully in Supabase!' as message;
