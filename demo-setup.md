# Demo Site Setup Guide

## Overview
Create a fully functional demo of your photography CRM that potential clients can interact with, showcasing the complete SaaS platform capabilities.

## Option 1: Separate Demo Deployment (Recommended)

### Setup Process:
1. **Fork/Clone this project** to a new Replit called "Photography-CRM-Demo"
2. **Configure demo mode** with sample data and limited functionality
3. **Deploy as separate application** with its own domain
4. **Link from your main website** with clear "Try Demo" button

### Demo Configuration:
- Pre-populated with sample clients, galleries, invoices
- Template selection works with all 25 templates
- Non-functional payments (demo mode)
- Limited admin access (no real data deletion)
- Clear "This is a demo" branding
- Contact form leads to your sales team

### Benefits:
- Full functionality showcase
- No impact on your main application
- Easy to maintain and update
- Professional presentation
- SEO benefits from separate domain

## Option 2: Demo Mode Toggle

### Implementation:
- Add `DEMO_MODE=true` environment variable
- Create demo data fixtures
- Disable destructive operations in demo mode
- Add demo banner/watermark
- Separate demo user authentication

### Benefits:
- Single codebase to maintain
- Easier to keep in sync
- Resource efficient

## Option 3: Video/Interactive Tour

### Create:
- Screen recording of full platform walkthrough
- Interactive Loom/tutorial videos
- Step-by-step feature showcase
- Before/after gallery examples

### Benefits:
- No server costs
- Always available
- Controlled narrative
- Mobile-friendly

## Recommended Implementation

**Best approach:** Option 1 (Separate Demo Deployment)

### Why this works best:
1. **Real experience** - Clients can actually use the software
2. **Template showcase** - They can switch between all 25 designs
3. **Feature exploration** - Full CRM, calendar, invoicing demo
4. **Lead generation** - Demo usage creates qualified leads
5. **Trust building** - Shows the platform actually works
6. **Sales tool** - Your team can walk prospects through live

### Technical Setup:
- Deploy to `demo-photography-crm.replit.app`
- Add prominent demo branding
- Pre-fill with realistic sample data
- Create demo user accounts
- Implement usage analytics
- Add "Get Started" conversion funnels

Would you like me to implement the separate demo deployment approach?