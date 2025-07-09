# TogNinja CRM - Photography Studio Management System

## Overview

TogNinja CRM is a full-stack web application built as a comprehensive customer relationship management system for photography studios. The application enables photographers to manage clients, galleries, bookings, invoices, and various business operations through both customer-facing and administrative interfaces.

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

## Changelog

Changelog:
- June 28, 2025. Initial setup and complete calendar system replacement with photography-focused solution