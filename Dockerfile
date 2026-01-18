FROM node:24-alpine AS base
 
# 1. Prune the workspace
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=@skeet/be --docker
 
# 2. Install dependencies and build
FROM base AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app
 
# Install dependencies
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
RUN yarn install --frozen-lockfile
 
# Copy source code
COPY --from=builder /app/out/full/ .
COPY .gitignore .gitignore

# Ensure shared/prisma/schema.prisma exists where expected
# In `services/main/package.json`, schema is at `../../shared/prisma/schema.prisma`
# This means when running from `services/main`, it looks up two levels.
# In the container, we are at `/app`.
# `turbo prune` should have preserved the workspace structure.
# Let's forcefully ensure it is there for safety.
COPY shared/prisma/schema.prisma /app/shared/prisma/schema.prisma

# Generate Prisma Client and Build
# We run the build command filtering for the backend. 
# Explicitly ensuring environment variables are passed if needed during build (often not for simple builds)
RUN yarn turbo run build --filter=@skeet/be
 
# 3. Production runner
FROM base AS runner
RUN apk add --no-cache openssl
WORKDIR /app
 
# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs
USER expressjs
 
COPY --chown=expressjs:nodejs --from=installer /app .
 
WORKDIR /app/services/main

# Expose the port the app runs on
EXPOSE 5445

# Start the application
CMD ["node", "dist/src/index.js"]
