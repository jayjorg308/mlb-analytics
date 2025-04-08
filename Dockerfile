# -------------------------
# Build Stage
# -------------------------
    FROM node:18-alpine AS builder

    # Set working directory
    WORKDIR /app
    
    # Install dependencies
    COPY package.json package-lock.json ./
    RUN npm ci
    
    # Copy app source files
    COPY . .
    
    # Increase memory limit for Node.js processes
    ENV NODE_OPTIONS="--max-old-space-size=2048"
    
    # Generate Prisma client
    RUN npx prisma generate
    
    # Build the Next.js app
    RUN npm run build
    
    # -------------------------
    # Production Stage
    # -------------------------
    FROM node:18-alpine
    
    # Set working directory
    WORKDIR /app
    
    # Copy only what’s needed to run the app
    COPY --from=builder /app/package.json ./
    COPY --from=builder /app/package-lock.json ./
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/.next ./.next
    COPY --from=builder /app/public ./public
    COPY --from=builder /app/prisma ./prisma  # only if needed at runtime (like migrations)
    
    # Set env again if needed
    ENV NODE_OPTIONS="--max-old-space-size=2048"
    
    # Expose port
    EXPOSE 3000
    
    # Start the app
    CMD ["npm", "run", "start"]
    