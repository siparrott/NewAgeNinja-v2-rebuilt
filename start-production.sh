#!/bin/bash
set -e

echo "🚀 Starting New Age Fotografie CRM..."

# Set production environment
export NODE_ENV=production
export DEMO_MODE=false

# Use production server if available, fallback to development
if [ -f "server/index.production.ts" ]; then
    echo "✅ Using production server configuration"
    exec tsx server/index.production.ts
else
    echo "⚠️  Fallback to development server"
    exec tsx server/index.ts
fi
