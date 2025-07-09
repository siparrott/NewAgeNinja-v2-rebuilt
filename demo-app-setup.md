# Photography CRM Demo App Setup

## Project Setup Instructions

To create the demo deployment, follow these steps:

### 1. Create New Replit Project
1. Go to Replit and click "Create Repl"
2. Choose "Import from GitHub" 
3. Use this repository URL: https://github.com/JpegWriter/THISONESURELY
4. Name it: "Photography-CRM-Demo"
5. Set it to Public

### 2. Configure Demo Environment
Add these environment variables to the new demo project:

```
DEMO_MODE=true
NODE_ENV=production
DATABASE_URL=[your demo database URL]
VITE_SUPABASE_URL=[demo supabase URL]
VITE_SUPABASE_ANON_KEY=[demo supabase key]
STRIPE_PUBLISHABLE_KEY=[demo stripe key]
```

### 3. Demo-Specific Modifications

#### A. Update package.json
Add demo-specific scripts:
```json
{
  "scripts": {
    "demo:setup": "node scripts/setup-demo-data.js",
    "demo:reset": "node scripts/reset-demo-data.js"
  }
}
```

#### B. Modify Homepage for Demo
- Add prominent "LIVE DEMO" banner
- Include demo user login buttons
- Add conversion tracking
- Link to main sales site

#### C. Pre-populate with Realistic Data
- 25 sample clients (families, weddings, newborns)
- 50+ gallery images from stock photography
- 15 completed invoices with realistic pricing
- 10 upcoming photography sessions
- Blog posts about photography services
- Contact form submissions

### 4. Demo User Accounts
Create these pre-configured accounts:

**Demo Photographer (Admin)**
- Email: demo@newagefotografie.com
- Password: demo2024
- Full admin access to all features

**Demo Client**
- Email: client@demo.com  
- Password: client2024
- Access to client portal and galleries

### 5. Template Showcase
- All 25 templates available and working
- Template switching functional
- Each template shows with realistic content
- Preview mode for all designs

### 6. Conversion Features
- "Get Started" buttons throughout interface
- Lead capture on template interactions
- Contact form for demo requests
- Pricing information and signup links

### 7. Demo Limitations
- No real payments processed
- Email sending disabled (demo mode)
- Data resets daily at midnight
- Limited file uploads
- Clear "Demo" watermarks

### 8. Deploy Configuration
- Set up custom domain: demo-photography-crm.replit.app
- Configure HTTPS
- Add analytics tracking
- Set up monitoring

## Post-Setup Tasks

1. **Test all features work in demo mode**
2. **Verify template switching functionality**
3. **Test website scraping wizard**
4. **Confirm lead capture works**
5. **Add demo to main website**

## Integration with Main Website

Add this HTML to your main photography website:

```html
<a href="https://demo-photography-crm.replit.app" 
   class="demo-button"
   target="_blank">
  Try Live Demo - See Your Photography Business Transformed
</a>
```

## Demo User Journey

1. **Landing Page** - Clear demo branding, login options
2. **Dashboard** - Populated with realistic photography business data
3. **Template Gallery** - Browse and preview all 25 designs
4. **Website Wizard** - Test scraping and customization
5. **CRM Features** - Explore client management, invoicing
6. **Gallery System** - Password-protected client galleries
7. **Conversion** - "Get Started" prompts throughout

This demo will showcase the complete SaaS platform and convert visitors into qualified leads for your photography CRM business.