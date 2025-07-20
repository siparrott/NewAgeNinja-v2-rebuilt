#!/bin/bash

# Production startup script to prevent hard refreshes
# This script builds the project once and runs the server without file watching

echo "🔧 Building production bundle..."
npm run build

echo "🚀 Starting keep-alive service..."
node keepalive.js &

echo "🏃‍♂️ Starting production server..."
NODE_ENV=production PORT=5000 tsx server/index.ts

# Keep the script running
wait