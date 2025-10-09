# Multi-stage build for OpenAI MCP Widget Server
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10.13.1

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY pizzaz_server_node/package.json ./pizzaz_server_node/

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build the assets
RUN pnpm build

# Production stage
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm@10.13.1

WORKDIR /app

# Copy package files for production dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY pizzaz_server_node/package.json ./pizzaz_server_node/

# Install all dependencies (tsx is needed to run TypeScript)
RUN pnpm install --frozen-lockfile

# Copy built assets from builder stage
COPY --from=builder /app/assets ./assets

# Copy server source code
COPY pizzaz_server_node/src ./pizzaz_server_node/src

# Expose port 8000
EXPOSE 8000

# Set working directory to server
WORKDIR /app/pizzaz_server_node

# Start the server
CMD ["pnpm", "start"]
