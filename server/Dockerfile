# Base stage - common configuration
FROM node:20-alpine AS base
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package.json package-lock.json* ./

# Dependencies stage - install all dependencies
FROM base AS dependencies
# Use npm install if package-lock.json doesn't exist, otherwise use npm ci
RUN if [ -f package-lock.json ]; then npm ci --include=dev; else npm install; fi

# Build stage - compile TypeScript
FROM dependencies AS build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production stage - optimized for deployment
FROM base AS production

# Install only production dependencies
RUN if [ -f package-lock.json ]; then npm ci --omit=dev && npm cache clean --force; else npm install --production && npm cache clean --force; fi

# Copy built application
COPY --from=build /app/dist ./dist

# Create non-root user
USER node

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]

# Development stage - with hot reload
FROM dependencies AS development

# Copy source files
COPY tsconfig.json nodemon.json ./

# Note: Development mode runs as root to avoid permission issues with volume mounts
# Production stage uses node user for security

# Expose application port and debug port
EXPOSE 3100 9229

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start with nodemon for hot reload
CMD ["npm", "run", "dev"]
