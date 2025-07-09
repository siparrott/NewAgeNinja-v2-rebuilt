#!/bin/bash

# Photography CRM Demo App Setup Script
# This script prepares the current project for demo deployment

echo "🎬 Setting up Photography CRM Demo App..."

# 1. Update package.json for demo
echo "📝 Updating package.json for demo mode..."
cat > package.json << 'EOF'
{
  "name": "photography-crm-demo",
  "version": "1.0.0",
  "description": "Live demo of Photography CRM SaaS platform",
  "type": "module",
  "scripts": {
    "dev": "NODE_ENV=development DEMO_MODE=true tsx server/index.ts",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "esbuild server/index.ts --bundle --platform=node --target=node18 --outfile=dist/index.js --external:@neondatabase/serverless",
    "start": "DEMO_MODE=true node dist/index.js",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "demo:setup": "node scripts/setup-demo-data.js",
    "demo:reset": "node scripts/reset-demo-data.js"
  },
  "keywords": ["photography", "crm", "saas", "demo"],
  "dependencies": {
    "@fullcalendar/daygrid": "^6.1.10",
    "@fullcalendar/interaction": "^6.1.10", 
    "@fullcalendar/react": "^6.1.10",
    "@fullcalendar/timegrid": "^6.1.10",
    "@hookform/resolvers": "^3.3.2",
    "@neondatabase/serverless": "^0.9.0",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-aspect-ratio": "^1.0.3",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-collapsible": "^1.0.3",
    "@radix-ui/react-context-menu": "^2.1.5",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-hover-card": "^1.0.7",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-menubar": "^1.0.4",
    "@radix-ui/react-navigation-menu": "^1.1.4",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-radio-group": "^1.1.3",
    "@radix-ui/react-scroll-area": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-toggle": "^1.0.3",
    "@radix-ui/react-toggle-group": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@tanstack/react-query": "^5.17.9",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "cmdk": "^0.2.0",
    "connect-pg-simple": "^9.0.1",
    "date-fns": "^3.2.0",
    "drizzle-orm": "^0.29.3",
    "drizzle-zod": "^0.5.1",
    "embla-carousel-react": "^8.0.0",
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "framer-motion": "^10.18.0",
    "input-otp": "^1.2.4",
    "jsdom": "^23.2.0",
    "lucide-react": "^0.323.0",
    "node-fetch": "^3.3.2",
    "papaparse": "^5.4.1",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "react": "^18.2.0",
    "react-countup": "^6.5.0",
    "react-day-picker": "^8.10.0",
    "react-dom": "^18.2.0",
    "react-helmet": "^6.1.0",
    "react-hook-form": "^7.49.3",
    "react-icons": "^5.0.1",
    "react-resizable-panels": "^1.0.9",
    "react-router-dom": "^6.21.3",
    "recharts": "^2.10.4",
    "tailwind-merge": "^2.2.1",
    "tailwindcss-animate": "^1.0.7",
    "typewriter-effect": "^2.21.0",
    "uuid": "^9.0.1",
    "vaul": "^0.8.9",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/connect-pg-simple": "^7.0.3",
    "@types/express": "^4.17.21",
    "@types/express-session": "^1.17.10",
    "@types/jsdom": "^21.1.6",
    "@types/node": "^20.11.5",
    "@types/node-fetch": "^2.6.11",
    "@types/papaparse": "^5.3.14",
    "@types/passport": "^1.0.16",
    "@types/passport-local": "^1.0.38",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@types/react-helmet": "^6.1.11",
    "@types/uuid": "^9.0.7",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "drizzle-kit": "^0.20.10",
    "esbuild": "^0.19.11",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.12"
  }
}
EOF

# 2. Create demo environment file
echo "🔧 Creating demo environment configuration..."
cat > .env.demo << 'EOF'
# Demo App Environment Variables
DEMO_MODE=true
NODE_ENV=production

# Database (You'll need to add your demo database URL)
DATABASE_URL=your_demo_database_url_here

# Supabase (Demo instance)
VITE_SUPABASE_URL=your_demo_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_demo_supabase_key_here

# Stripe (Test mode)
STRIPE_PUBLISHABLE_KEY=pk_test_demo_key_here
STRIPE_SECRET_KEY=sk_test_demo_key_here
STRIPE_WEBHOOK_SECRET=whsec_demo_webhook_here

# Demo Configuration
DEMO_STUDIO_NAME="Demo Photography Studio"
DEMO_STUDIO_EMAIL="demo@photographycrm.com"
DEMO_STUDIO_PHONE="+1 (555) 123-4567"
EOF

# 3. Update replit.nix for demo
echo "⚙️ Updating Replit configuration..."
cat > replit.nix << 'EOF'
{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.postgresql
  ];
}
EOF

# 4. Create demo-specific replit config
cat > .replit << 'EOF'
modules = ["nodejs-18", "web"]
hidden = [".config", "tsconfig.json", "tsconfig.node.json", "vite.config.ts", ".gitignore"]

[nix]
channel = "stable-23_11"

[unitTest]
language = "nodejs"

[deployment]
deploymentTarget = "static"
publicDir = "dist/public"
build = "npm run build"

[[ports]]
localPort = 5000
externalPort = 80

[env]
DEMO_MODE = "true"
NODE_ENV = "production"
EOF

echo "✅ Demo app configuration complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add your demo database URL to .env.demo"
echo "2. Configure Supabase demo instance"
echo "3. Run 'npm run demo:setup' to populate sample data"
echo "4. Deploy to Replit with 'Deploy' button"
echo ""
echo "🔗 Demo will be available at: https://photography-crm-demo.replit.app"