# ---------- Builder Stage ----------
    FROM node:18-bullseye-slim AS builder

    WORKDIR /app
    
    # Install OpenSSL for Prisma generate
    RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
    
    # Copy package files first to leverage Docker cache
    COPY backend/package*.json ./
    COPY backend/prisma ./prisma/
    
    # Install dependencies (including dev dependencies for build)
    RUN npm ci && npm cache clean --force
    
    # Copy backend source code
    COPY backend/ .
    
    # Generate Prisma Client
    RUN npx prisma generate --schema=./prisma/schema.prisma
    
    # Build the NestJS application
    RUN npm run build
    
    # ---------- Production Stage (Refactored for Correct Permissions) ----------
    FROM node:18-bullseye-slim AS production

    WORKDIR /app
    
    # 1. Install runtime dependencies first
    RUN apt-get update
    RUN apt-get install -y dumb-init postgresql-client wget curl && rm -rf /var/lib/apt/lists/*

    # 2. Copy all necessary application files from the builder stage
    # The owner will be root temporarily, which is fine.
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/prisma ./prisma
    COPY --from=builder /app/public ./public
    COPY --from=builder /app/package*.json ./
    COPY entrypoint.sh ./entrypoint.sh
    RUN chmod +x ./entrypoint.sh

    # 3. NOW, create the non-root user and give it ownership of the entire /app directory.
    # This is the key fix.
    RUN addgroup --system --gid 1001 nodejs && \
        adduser --system --uid 1001 --ingroup nodejs nestjs && \
        chown -R nestjs:nodejs /app

    # 4. Switch to the non-root user for all subsequent operations
    USER nestjs


    # Set environment
    ENV NODE_ENV=production

    EXPOSE 3000

    # Use dumb-init to handle signals
    ENTRYPOINT ["dumb-init", "--", "./entrypoint.sh"]

    # Start application
    CMD ["node", "dist/main.js"]


    