# Production Dockerfile with flexible path resolution
FROM node:18-alpine

# Create app directory with proper permissions
WORKDIR /app

# Copy package.json files to multiple locations for flexibility
COPY dist/package.json ./package.json
COPY dist/package.json /home/node/package.json

# Copy built application files
COPY dist/ ./

# Install production dependencies
RUN npm ci --only=production --silent && \
    npm cache clean --force

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Set ownership and permissions
RUN chown -R nextjs:nodejs /app /home/node
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "import('http').then(h => h.get('http://localhost:5000/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1)))"

# Expose port
EXPOSE 5000

# Multiple start command options
ENV NODE_ENV=production
ENV PORT=5000

# Use the flexible start script
CMD ["node", "start.mjs"]
