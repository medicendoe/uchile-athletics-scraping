# Multi-stage build para Astro
FROM node:18-alpine

WORKDIR /app

# Instalar dependencias
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Construir sitio estático
RUN npm run build