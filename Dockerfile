# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npx prisma generate
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy the standalone output (Next.js bundles everything needed here)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy prisma since it's needed at runtime for queries
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "server.js"]