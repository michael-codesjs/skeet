# syntax=docker/dockerfile:1
# Single-stage Dockerfile for @skeet/be (services/main)
FROM node:24-slim

# 1. Install system dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Copy workspace config and shared resources
COPY package.json yarn.lock ./
COPY shared/prisma/schema.prisma ./shared/prisma/

# 3. Copy service specific config
COPY services/main/package.json ./services/main/
COPY services/main/tsconfig.json ./services/main/

# 4. Install dependencies with BuildKit caching
# This significantly speeds up subsequent builds by caching the yarn cache directory.
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --frozen-lockfile

# 5. Copy service source and build
COPY services/main ./services/main
WORKDIR /app/services/main

# Set environment variable for Prisma to find the schema during generation if needed
ENV PRISMA_SCHEMA_PATH="../../shared/prisma/schema.prisma"

RUN yarn generate
RUN yarn build

# 6. Runtime Configuration
ENV NODE_ENV=production
ENV PORT=5445
EXPOSE 5445

# Start the application
CMD ["node", "dist/src/index.js"]
