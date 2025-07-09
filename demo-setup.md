# Photography CRM Demo App - Complete Setup Guide

## Step 1: Create New Replit Project

1. Go to [Replit Dashboard](https://replit.com/~)
2. Click "Create Repl"
3. Choose "Import from GitHub"
4. Repository URL: `https://github.com/JpegWriter/THISONESURELY`
5. Repl Name: `photography-crm-demo`
6. Set to Public visibility

## Step 2: Configure Demo Environment Variables

Add these to the new demo project's Secrets:

```
DEMO_MODE=true
NODE_ENV=production

# Demo Studio Configuration
VITE_DEMO_MODE=true
VITE_DEMO_STUDIO_NAME=Photography CRM Demo
VITE_DEMO_STUDIO_EMAIL=demo@photographycrm.com
VITE_DEMO_STUDIO_PHONE=+1 (555) 123-DEMO

# Database (Use Neon or Supabase for demo)
DATABASE_URL=postgresql://demo_user:demo_password@demo-host/demo_db

# Supabase Demo Instance
VITE_SUPABASE_URL=https://your-demo-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_demo_anon_key

# Stripe Test Keys
STRIPE_PUBLISHABLE_KEY=pk_test_demo_key
STRIPE_SECRET_KEY=sk_test_demo_key
STRIPE_WEBHOOK_SECRET=whsec_demo_webhook
```

## Step 3: Modify for Demo Mode

Update these files for demo deployment:

### 1. Update .replit file:
```
modules = ["nodejs-18", "web"]

[nix]
channel = "stable-23_11"

[deployment]
deploymentTarget = "static"
publicDir = "dist/public"
build = "npm run build"

[[ports]]
localPort = 5000
externalPort = 80

[env]
DEMO_MODE = "true"
```

### 2. Update package.json name:
```json
{
  "name": "photography-crm-demo",
  "description": "Live demo of Photography CRM SaaS platform"
}
```

## Step 4: Populate Demo Data

Run these commands in the new project:

```bash
# Install dependencies
npm install

# Setup database schema
npm run db:push

# Populate demo data
npm run demo:setup

# Start demo app
npm run dev
```

## Step 5: Demo Features Included

✅ **25+ Realistic Photography Clients**
- Families, weddings, newborns, corporate headshots
- Complete contact information and session history
- Realistic pricing and payment status

✅ **Completed Photography Sessions**
- Wedding ceremonies, family portraits, newborn sessions
- Equipment tracking, weather conditions, location details
- Professional session notes and client feedback

✅ **Professional Invoicing System**
- 15+ sample invoices with realistic pricing
- Payment tracking and overdue notifications
- Stripe integration for payment processing

✅ **Client Gallery System**
- Password-protected client galleries
- High-quality sample photography
- Download and sharing capabilities

✅ **All 25 Website Templates**
- Professional photography website designs
- Template switching and customization
- Mobile-responsive layouts

✅ **AI Website Import Wizard**
- Website scraping and content analysis
- SEO optimization recommendations
- Automated migration workflow

## Step 6: Demo User Accounts

### Admin Account (Full Access)
- Email: `demo@newagefotografie.com`
- Password: `demo2024`
- Access: Complete admin dashboard, all features

### Client Account (Portal Access)
- Email: `client@demo.com`
- Password: `client2024`
- Access: Client portal, gallery viewing, appointment booking

## Step 7: Deploy Demo App

1. **Test locally first**: Ensure all features work
2. **Deploy to Replit**: Use the Deploy button
3. **Custom domain**: Configure `demo.photographycrm.com`
4. **SSL certificate**: Automatically handled by Replit

## Step 8: Integration with Main Website

Add this to your main photography website:

```html
<!-- Demo CTA Button -->
<a href="https://photography-crm-demo.replit.app" 
   class="demo-cta-button"
   target="_blank">
  <span>Try Live Demo</span>
  <span>See Your Photography Business Transformed</span>
</a>

<!-- Demo Features Section -->
<section class="demo-features">
  <h2>Experience the Complete Platform</h2>
  <div class="demo-grid">
    <div class="demo-feature">
      <h3>Client Management</h3>
      <p>Explore our advanced CRM with 25+ sample clients</p>
      <a href="https://photography-crm-demo.replit.app/admin/clients">View Demo</a>
    </div>
    <div class="demo-feature">
      <h3>Website Templates</h3>
      <p>Browse all 25 professional photography designs</p>
      <a href="https://photography-crm-demo.replit.app/admin/studio-templates">Browse Templates</a>
    </div>
    <div class="demo-feature">
      <h3>Website Import Wizard</h3>
      <p>Test our AI-powered website migration system</p>
      <a href="https://photography-crm-demo.replit.app/admin/website-wizard">Try Wizard</a>
    </div>
  </div>
</section>
```

## Step 9: Lead Capture Integration

Demo includes conversion tracking for:
- Template interactions
- Feature exploration time
- Contact form submissions
- Trial signup requests

## Step 10: Maintenance

- **Data Reset**: Automatically resets daily at midnight
- **Updates**: Sync with main repository weekly
- **Monitoring**: Built-in analytics and error tracking

## Expected Demo Performance

- **Load Time**: < 3 seconds
- **Template Switching**: < 1 second
- **Data Queries**: < 500ms
- **Image Loading**: Progressive with lazy loading

This demo will showcase your complete photography CRM SaaS platform and convert visitors into qualified leads for your business.