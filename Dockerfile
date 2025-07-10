# Dockerfile for Photography CRM Demo - ES Module Compatible
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY deployment-package.json package.json
COPY package-lock.json* ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application
COPY dist/ ./dist/
COPY start.mjs ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

# Start the application using ES module script
CMD ["node", "start.mjs"]