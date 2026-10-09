# ==============================================================================
# Chronos Timetable - Production Multi-Stage Dockerfile
# Optimized for lightweight image size, security, and fast CI/CD pipeline builds
# ==============================================================================

# Stage 1: Build & Verification Stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json* bun.lock* ./

# Install all dependencies (including devDependencies required for Vite and TypeScript)
RUN npm install

# Copy application source code
COPY . .

# Run validation and build
RUN npm run lint
RUN npm run build

# ==============================================================================
# Stage 2: Production Runtime Stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV VAULTS_DIR=/app/.sync_vaults

# Copy package definition
COPY package.json ./

# Install production and server execution dependencies
RUN npm install --omit=dev && npm install tsx

# Copy compiled frontend and server entrypoint from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Create directory for persistent encrypted zero-knowledge vaults
RUN mkdir -p /app/.sync_vaults && chown -R node:node /app

# Run as non-privileged node user for security
USER node

# Expose web application port
EXPOSE 3000

# Container healthcheck for orchestrators (Docker, Kubernetes, Jenkins Pipeline)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start production server
CMD ["npm", "start"]
