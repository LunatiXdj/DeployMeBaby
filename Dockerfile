# Dockerfile for Next.js App

# 1. Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Build the application
FROM node:18-alpine AS builder
WORKDIR /app
ARG FIREBASE_ADMIN_SDK_CONFIG_BASE64
ENV FIREBASE_ADMIN_SDK_CONFIG_BASE64=$FIREBASE_ADMIN_SDK_CONFIG_BASE64
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3. Production image
FROM node:18-alpine AS runner
WORKDIR /app
ARG FIREBASE_ADMIN_SDK_CONFIG_BASE64
ENV FIREBASE_ADMIN_SDK_CONFIG_BASE64=$FIREBASE_ADMIN_SDK_CONFIG_BASE64

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
