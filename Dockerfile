# =============================================================================
# Splendubious Backend Dockerfile
# =============================================================================
# Multi-stage build for the backend server with rules-engine dependency

# -----------------------------------------------------------------------------
# Stage 1: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY packages/rules-engine/package.json ./packages/rules-engine/
COPY packages/backend/package.json ./packages/backend/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code and config
COPY tsconfig.base.json ./
COPY packages/rules-engine ./packages/rules-engine
COPY packages/backend ./packages/backend

# Build rules-engine first (backend depends on it)
RUN npm run build --workspace=@splendubious/rules-engine

# Build backend
RUN npm run build --workspace=@splendubious/backend

# -----------------------------------------------------------------------------
# Stage 2: Production
# -----------------------------------------------------------------------------
FROM node:20-alpine
WORKDIR /app

# Copy package files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/rules-engine/package.json ./packages/rules-engine/
COPY --from=builder /app/packages/backend/package.json ./packages/backend/

# Copy built artifacts
COPY --from=builder /app/packages/rules-engine/dist ./packages/rules-engine/dist
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist

# Install production dependencies only
RUN npm ci --omit=dev

# Expose the backend port
EXPOSE 3001

# Set environment defaults
ENV PORT=3001
ENV NODE_ENV=production

# Start the server
CMD ["node", "packages/backend/dist/index.js"]
