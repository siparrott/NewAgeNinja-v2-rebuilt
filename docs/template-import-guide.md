# Template Import Guide: Bolt.new to Replit

## Overview
This guide explains how to import your 25 photography website templates from Bolt.new into your Replit template management system.

## Step 1: Export from Bolt.new

For each of your 25 templates in Bolt.new:

1. **Download the source code:**
   - Click "Download" or "Export" in Bolt.new
   - Save as ZIP file (e.g., `template-06-portrait-elegance.zip`)

2. **Get preview screenshots:**
   - Take full-page screenshots of each template
   - Save as JPG/PNG: `template-06-portrait-elegance-preview.jpg`

3. **Document template details:**
   - Template name and category
   - Key features and target photographer type
   - Color scheme (primary, secondary, accent colors)
   - Whether it's premium or free tier

## Step 2: Organize Template Files

Create this folder structure in your project:
```
/templates/
  ├── template-06-portrait-elegance/
  │   ├── src/                    # React components
  │   ├── styles/                 # CSS/Tailwind files
  │   ├── assets/                 # Images, fonts
  │   ├── config.json             # Template metadata
  │   └── preview.jpg             # Screenshot
  ├── template-07-wedding-luxury/
  └── ... (23 more templates)
```

## Step 3: Convert Templates to Components

Each Bolt.new template needs to be converted to React components:

### A. Extract Components
From each template, extract:
- `HomePage.tsx` - Main landing page
- `GalleryPage.tsx` - Photo gallery layout
- `ContactPage.tsx` - Contact form
- `BlogPage.tsx` - Blog listing
- `Layout.tsx` - Header/footer/navigation

### B. Create Template Config
For each template, create `config.json`:
```json
{
  "id": "template-06-portrait-elegance",
  "name": "Portrait Elegance", 
  "description": "Sophisticated portrait photography showcase",
  "category": "classic",
  "features": ["Portrait Focus", "Elegant Layout", "Client Gallery", "Booking"],
  "colorScheme": {
    "primary": "#8B4513",
    "secondary": "#F5F5DC", 
    "accent": "#DAA520",
    "background": "#FFFFFF"
  },
  "layout": {
    "headerStyle": "centered",
    "navigationStyle": "horizontal", 
    "footerStyle": "detailed"
  },
  "isPremium": true
}
```

## Step 4: Update Template System

Add your templates to the system:

### A. Add to Template Definitions
In `server/template-system.ts`, expand the `AVAILABLE_TEMPLATES` array:

```typescript
export const AVAILABLE_TEMPLATES: TemplateConfig[] = [
  // Existing 5 templates...
  
  {
    id: 'template-06-portrait-elegance',
    name: 'Portrait Elegance',
    description: 'Sophisticated portrait photography showcase',
    category: 'classic',
    // ... rest of config
  },
  // Add remaining 19 templates
];
```

### B. Create Template Components
For each template, create a component set:

```typescript
// templates/template-06-portrait-elegance/components/HomePage.tsx
import React from 'react';

interface HomePageProps {
  studioConfig: StudioConfig;
}

export const HomePage: React.FC<HomePageProps> = ({ studioConfig }) => {
  return (
    <div className="template-06-portrait-elegance">
      {/* Template-specific homepage layout */}
    </div>
  );
};
```

## Step 5: Template Switching Logic

Implement dynamic template loading:

### A. Template Router
Create a template router that loads the correct components:

```typescript
// client/src/components/TemplateRouter.tsx
import { studioConfig } from '../lib/studio-config';

const TemplateRouter = () => {
  const currentTemplate = studioConfig.activeTemplate;
  
  // Dynamically import and render template
  const TemplateComponent = lazy(() => 
    import(`../templates/${currentTemplate}/components/HomePage`)
  );
  
  return <TemplateComponent studioConfig={studioConfig} />;
};
```

### B. CSS Variable System
Each template applies its colors via CSS variables:

```css
/* templates/template-06-portrait-elegance/styles.css */
.template-06-portrait-elegance {
  --primary-color: #8B4513;
  --secondary-color: #F5F5DC;
  --accent-color: #DAA520;
  --background-color: #FFFFFF;
}
```

## Step 6: Preview System

Set up template previews:

### A. Preview Route
Create `/preview/:templateId` route that shows template with sample data:

```typescript
// client/src/pages/TemplatePreview.tsx
const TemplatePreview = () => {
  const { templateId } = useParams();
  const sampleStudioConfig = getSampleConfig();
  
  return <TemplateRenderer template={templateId} config={sampleStudioConfig} />;
};
```

### B. Upload Preview Images
Store template screenshots in `/public/templates/previews/`

## Migration Steps

1. **Phase 1:** Import 5 most popular templates first
2. **Phase 2:** Add remaining 20 templates 
3. **Phase 3:** Implement template switching functionality
4. **Phase 4:** Add premium features and subscription gates

## File Structure After Import

```
/templates/
  ├── template-01-modern-minimal/     # Existing
  ├── template-02-elegant-classic/    # Existing  
  ├── template-03-bold-artistic/      # Existing
  ├── template-04-wedding-romance/    # Existing
  ├── template-05-family-warm/        # Existing
  ├── template-06-portrait-elegance/  # New from Bolt
  ├── template-07-wedding-luxury/     # New from Bolt
  ├── template-08-newborn-soft/       # New from Bolt
  └── ... (17 more from Bolt.new)
```

Would you like me to help you import specific templates or set up the template switching infrastructure?