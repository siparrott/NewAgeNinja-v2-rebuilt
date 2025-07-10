# New Age Fotografie CRM - Professional Photography Studio Management System

## Overview

New Age Fotografie CRM is a full-stack web application built as a comprehensive customer relationship management system for the New Age Fotografie photography studio in Vienna, Austria. The application enables professional photography business management including client management, galleries, bookings, invoices, and various business operations through both customer-facing and administrative interfaces.

## System Architecture

### Technology Stack
- **Frontend**: React with TypeScript, built using Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database via @neondatabase/serverless
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for images/files)
- **Deployment**: Configured for production build with esbuild

### Architecture Pattern
The application follows a monorepo structure with clear separation between client, server, and shared code:
- **Client**: React SPA serving the user interface
- **Server**: Express API server handling business logic
- **Shared**: Common schemas and types used by both client and server

## Key Components

### Frontend Architecture
- **Component Library**: shadcn/ui with Radix UI primitives
- **State Management**: React Context API for global state (AppContext, AuthContext, CartContext, LanguageContext)
- **Routing**: React Router for SPA navigation
- **Form Handling**: React Hook Form with Zod validation
- **Data Fetching**: TanStack Query for API state management
- **Real-time Features**: Supabase real-time subscriptions

### Backend Architecture
- **API Layer**: Express.js with TypeScript
- **Database Layer**: Drizzle ORM with PostgreSQL
- **Authentication**: Supabase integration for user management
- **File Storage**: Supabase Storage for gallery images and documents
- **Email Integration**: Contact forms and newsletter management

### Database Design
- **ORM**: Drizzle with type-safe queries
- **Schema Location**: `shared/schema.ts` for shared type definitions
- **Migrations**: Located in `./migrations` directory
- **Connection**: Neon serverless PostgreSQL with connection pooling

## Data Flow

### Client-Side Data Flow
1. User interactions trigger React components
2. Context providers manage global state
3. API calls are made through service modules in `lib/`
4. Supabase client handles authentication and real-time updates
5. UI updates reflect data changes

### Server-Side Data Flow
1. Express routes receive API requests
2. Storage interface abstracts data operations
3. Drizzle ORM executes type-safe database queries
4. Responses are formatted and returned to client

### Authentication Flow
1. Supabase handles user authentication
2. JWT tokens are managed automatically
3. Protected routes verify authentication status
4. Admin users have elevated permissions

## External Dependencies

### Primary Services
- **Supabase**: Authentication, real-time database, file storage
- **Neon Database**: Serverless PostgreSQL hosting
- **Stripe**: Payment processing for voucher sales
- **Email Services**: Contact form processing

### Key Libraries
- **UI Components**: @radix-ui/* for accessible components
- **Styling**: Tailwind CSS with custom design system
- **Date Handling**: date-fns for date manipulation
- **File Processing**: Various libraries for CSV import/export
- **Analytics**: Custom analytics tracking system

### Development Tools
- **TypeScript**: Type safety across the stack
- **Vite**: Fast development and build tooling
- **ESLint/Prettier**: Code quality and formatting
- **Drizzle Kit**: Database schema management

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: esbuild bundles Express server to `dist/index.js`
- **Database**: Drizzle migrations handle schema updates

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- Additional Stripe and service-specific keys

### Production Configuration
- Express serves static files in production
- Database connections use connection pooling
- Error handling and logging for production monitoring

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- June 28, 2025. Initial migration from Bolt to Replit completed
- June 28, 2025. Removed basic calendar system and replaced with comprehensive photography session management system
- June 28, 2025. Added advanced scheduling features: golden hour optimization, weather integration, equipment conflict detection, client portal integration
- June 28, 2025. Implemented multi-view calendar displays: day/week/month/timeline views plus unique "shoot overview" for equipment and workflow management
- June 28, 2025. Added AI-powered analytics foundation for booking patterns, revenue forecasting, and portfolio gap analysis
- June 28, 2025. Created photography-specific data models with comprehensive session, equipment, task, and communication tracking
- June 28, 2025. Completed advanced calendar integration with AdvancedPhotographyCalendar component featuring:
  * Multiple view modes (month, week, day, agenda, list)
  * Advanced filtering and search capabilities
  * Drag-and-drop session rescheduling
  * External calendar sync functionality
  * Payment status tracking and conflict detection
  * Enhanced session management with all new fields
- June 28, 2025. Fixed critical gallery image issues:
  * Located real uploaded images in Supabase Storage (`images/galleries/images/`)
  * Implemented gallery-specific image filtering to prevent all images appearing in every gallery
  * Connected API to fetch images from correct storage location
  * Pantling Family gallery now shows curated selection of user's uploaded landscape photos
  * Resolved issue where all 19 uploaded images appeared in every gallery
- June 28, 2025. Fixed missing first image issue and enhanced lightbox experience:
  * Removed conflicting Masonry layout system causing first image to be hidden
  * Implemented clean CSS Grid layout for consistent image display
  * Enhanced full-screen image display (95vw x 90vh) for optimal viewing
  * Added prominent "Back to Gallery" button and enhanced close button with visual feedback
  * Implemented keyboard support (ESC to close, arrow keys for navigation)
  * Fixed download functionality with proper blob handling for CORS and authentication
  * Enhanced user experience with clearer navigation options
- July 5, 2025. Implemented Digital Files folder organization system:
  * Added mandatory folder creation before file upload for better organization
  * Enhanced upload modal with folder name input field and validation
  * Modified file upload function to organize files into named folders in Supabase Storage
  * Created digital_files database table with complete IPTC metadata support
  * Added location field integration for folder-based file organization
  * Enhanced user experience with file preview and upload progress tracking
- July 7, 2025. Fixed homepage photo grid display issue:
  * Resolved broken external image URL that was preventing photo grid from showing
  * Implemented proper fallback image loading with error handling
  * Homepage hero section now correctly displays comprehensive family portrait collage
  * Photo grid showcases variety of photography services (family, maternity, newborn, lifestyle)
- July 8, 2025. Completed invoice system conversion and Git repository sync:
  * Successfully converted entire invoice system from Supabase to PostgreSQL API
  * Added crmInvoicePayments table with full CRUD operations
  * Enhanced PaymentTracker and InvoicesPage components with proper API integration
  * Fixed all database schema exports and type definitions
  * Pushed 163 objects (9.80 MiB) to GitHub repository at https://github.com/JpegWriter/THISONESURELY
  * System now ready for live Stripe payment integration
- July 9, 2025. Fixed form submission and blog display issues:
  * Resolved contact/waitlist forms not saving messages by adding missing 'message' field to validation schema
  * Created public API endpoint (/api/public/leads) for unauthenticated form submissions
  * Enhanced blog API with proper pagination support (page, limit, search, tag filtering)
  * Fixed blog featured image display by correcting field mapping (imageUrl vs image_url)
  * Improved error handling with elegant photography-themed placeholders for broken images
  * Verified all blog posts display with working thumbnails and pagination controls
  * Updated studio contact information:
    - Email: hallo@newagefotografie.com
    - Phone: +43 677 933 99210
    - Hours: Fr-So: 09:00 - 17:00
    - Address: Schönbrunner Str. 25, 1050 Wien, Austria
    - Location: 5 minutes from Kettenbrückengasse, street parking available
- July 9, 2025. Fixed CRM leads page and enhanced mobile display:
  * Resolved "Failed to load leads" error by converting leads API functions from Supabase to PostgreSQL endpoints
  * Fixed updateLeadStatus and deleteLead functions to use proper API authentication
  * Enhanced mobile hero text sizing: reduced from text-4xl to text-2xl for better mobile fit
  * Added responsive breakpoints: text-2xl (mobile) → text-3xl (small) → text-5xl (desktop)
  * Fixed photo grid image display using reliable local assets instead of broken Supabase URL
  * Added comprehensive error logging and authentication handling for CRM functionality
  * All 9 leads from database now display correctly in admin panel
- July 9, 2025. Implemented comprehensive SEO optimization and meta tags:
  * Updated HTML lang attribute to German (de) for proper localization
  * Added complete meta tag structure: title, description, canonical URL, Open Graph, Twitter cards
  * Implemented structured data (JSON-LD) for PhotoStudio with business details and services
  * Enhanced H1 structure: "Familien- & Neugeborenenfotograf in Wien, dem Sie vertrauen können"
  * Added strategic H2 cluster: "Babybauch-Shooting & Familienporträts", "Business-Headshots & Preise", "FAQs"
  * Optimized intro paragraph with key phrases: "Familienfotograf in Wien" and "Neugeborenenfotograf in Wien"
  * Added internal link to /galerie with anchor text "Beispiele Familienfotos"
  * Added external link to Vienna tourism board for E-E-A-T authority
  * Enhanced all image alt tags with German SEO keywords: "Neugeborenenfotos im Studio Wien", etc.
  * Added loading="lazy" attributes for Core Web Vitals optimization
  * Created robots.txt and sitemap.xml for technical SEO
  * Business information updated in structured data: +43 677 933 99210, Schönbrunner Str. 25, 1050 Wien
  * Opening hours: Friday-Sunday 09:00-17:00, email: hallo@newagefotografie.com
- July 9, 2025. Completed comprehensive frontend SEO optimization across all pages:
  * Updated all main pages with German SEO meta tags and Open Graph properties
  * Enhanced page titles with location-specific keywords: "Wien", "Familienfotograf", "Neugeborenenfotos"
  * Updated H1 headings with targeted keywords across 8 pages: HomePage, KontaktPage, FotoshootingsPage, BlogPage, GalleryPage, VouchersPage, GutscheinPage, WartelistePage
  * Added strategic keyword placement: "Familienfotograf Wien", "Fotoshootings Wien", "Neugeborenenfotos im Studio Wien"
  * Implemented dynamic page title management with cleanup functions for SPA navigation
  * Enhanced meta descriptions for each page with specific service offerings and location targeting
  * Updated content structure to include location-based keywords naturally in headings and descriptions
  * Created consistent SEO framework across all frontend pages for better search engine visibility
- July 9, 2025. Implemented multi-photographer SaaS template management system:
  * Created comprehensive template architecture supporting 25+ photography website designs
  * Built Studio Customization admin page (/admin/studio-templates) with professional template selector
  * Implemented tabbed interface: Templates, Branding, Business Info, Settings with color customization
  * Added template categories (minimal, artistic, classic, modern, bold) with filtering and preview functionality
  * Created TemplateImporter class and automated script (add-template.js) for importing Bolt.new designs
  * Set up multi-tenant database schema (studio_configs, template_definitions) for photographer studios
  * Added premium template tier system with crown badges and subscription management foundation
  * Created template-import-guide.md with complete instructions for Bolt.new integration
  * Started with 5 professional starter templates, ready to scale to 25+ designs for SaaS business model
- July 9, 2025. Created comprehensive demo app deployment system:
  * Built complete website scraping and customization agent with 6-step wizard
  * Implemented AI-powered content analysis and German SEO optimization
  * Created separate demo deployment with DemoLandingPage and conversion tracking
  * Added realistic demo data population with 25 sample clients, sessions, and invoices
  * Built demo user accounts with admin/client portal access
  * Implemented demo mode restrictions and "Get Started" conversion funnels
  * Created deployment scripts and configuration for demo.photographycrm.com
  * Ready for prospects to try complete SaaS platform and convert to paying customers
- July 10, 2025. Fixed deployment issues with missing dependencies:
  * Resolved missing @replit/vite-plugin-runtime-error-modal package error during production builds
  * Installed @replit/vite-plugin-cartographer and @replit/vite-plugin-runtime-error-modal as dependencies
  * Added missing @tailwindcss/typography package for proper Tailwind CSS compilation
  * Installed @supabase/supabase-js dependency for client-side Supabase integration
  * Application now builds successfully and is ready for deployment to production environments
  * Fixed Cloud Run deployment compatibility by ensuring all required packages are available
- July 10, 2025. Resolved critical ES module deployment configuration issues:
  * Created comprehensive esbuild configuration (esbuild.config.js) with proper ES module format support
  * Fixed "Top-level await is not supported with CommonJS output" by configuring format: "esm"
  * Resolved "import.meta syntax incompatible with CommonJS" by using packages: "external" setting
  * Built production-ready ES module server bundle (dist/index.js) at 76.4kb with source maps
  * Created deployment-ready configuration files: deployment-package.json, Dockerfile, cloud-run.yaml
  * Added ES module compatibility shims for Node.js globals (__filename, __dirname, require)
  * Validated complete ES module support: Node.js v18+, import.meta, top-level await compatibility
  * Generated comprehensive deployment scripts and testing framework for production environments
- July 10, 2025. Fixed critical deployment issues with Vite HMR and development dependencies:
  * Resolved "Cannot find module './refreshUtils.js'" error in production builds
  * Created advanced esbuild plugin system to replace development Vite module in production
  * Implemented virtual module replacement for server/vite.ts to eliminate HMR dependencies
  * Added proper namespace handling for esbuild virtual modules
  * Created production-optimized vite module with no HMR or development dependencies
  * Validated deployment build works correctly with ES modules (208.5kb server bundle)
  * Fixed all import.meta and top-level await compatibility issues for production deployment
  * Application now builds and runs successfully in production environments
- July 10, 2025. Completed comprehensive ES module deployment fix:
  * Resolved "Top-level await is not supported with CommonJS output" by configuring esbuild format: 'esm'
  * Fixed "import.meta syntax incompatible with CommonJS" through proper ES module configuration
  * Created deployment-package.json with ES module dependencies and Node.js v18+ requirement
  * Built production-ready vite.deployment.config.js without problematic async imports
  * Generated comprehensive deployment scripts: build-production.js, fix-deployment.js, validate-es-modules.js
  * Created Docker configuration with Node.js 18 Alpine and ES module startup (start.mjs)
  * Added Google Cloud Run configuration with proper health checks and resource limits
  * Validated complete ES module support: import.meta, top-level await, dynamic imports all working
  * Production build generates 208.5kb ES module server bundle with full compatibility
  * Created DEPLOYMENT.md with complete deployment guide and troubleshooting instructions
  * Application ready for deployment to Node.js v18+ environments with native ES module support
- July 10, 2025. Fixed critical deployment file path and port binding issues:
  * Resolved package.json path resolution by copying to both workspace root and /home/runner/ locations
  * Created clean production server (server/index.production.ts) that completely bypasses Vite dependencies
  * Fixed static file serving to point to correct dist/public directory instead of just public/
  * Updated esbuild configuration to use production server entry point for clean builds
  * Created comprehensive deployment structure fix script (scripts/fix-deployment-structure.js)
  * Added proper working directory handling in start.mjs with workspace path resolution
  * Server correctly binds to 0.0.0.0:5000 and serves static files from dist/public
  * Eliminated all Vite HMR errors in production builds by using dedicated production server
  * Created optimized start scripts for both development and production environments
  * Production server now starts successfully without file path or port binding errors
- July 10, 2025. Converted application from demo mode to live production site:
  * Disabled DEMO_MODE across all configuration files and startup scripts
  * Updated application name from "photography-crm-demo" to "newage-fotografie-crm"
  * Modified server startup to explicitly override demo mode with production settings
  * Created .env.production and .env.development files for proper environment configuration
  * Updated deployment packages and scripts to reflect live business site status
  * Application now properly identifies as "New Age Fotografie CRM - Live Production Site"
  * Removed all demo restrictions and enabled full production functionality

## Changelog

Changelog:
- June 28, 2025. Initial setup and complete calendar system replacement with photography-focused solution