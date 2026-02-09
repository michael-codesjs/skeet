FROM node:24-slim AS base

# 1. Prune the workspace
FROM base AS builder
RUN apt-get update && apt-get install -y libc6-dev
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=@skeet/be --docker

# 2. Install dependencies and build
FROM base AS installer
RUN apt-get update && apt-get install -y libc6-dev
WORKDIR /app

# Install dependencies
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
RUN yarn install --frozen-lockfile

# Copy source code
COPY --from=builder /app/out/full/ .
COPY .gitignore .gitignore

# Ensure shared/prisma/schema.prisma exists where expected
COPY shared/prisma/schema.prisma /app/shared/prisma/schema.prisma

# Generate Prisma Client and Build
RUN yarn turbo run build --filter=@skeet/be
 
# 3. Production runner
FROM base AS runner
RUN apt-get update && apt-get install -y \
    openssl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
 
# Don't run production as root
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 expressjs
USER expressjs
 
COPY --chown=expressjs:nodejs --from=installer /app .
 
WORKDIR /app/services/main

# Expose the port the app runs on
EXPOSE 5445

# Env vars
ENV NODE_ENV=production
ENV PORT=5445

# Start the application
CMD ["node", "dist/src/index.js"]
