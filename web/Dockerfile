# Multi-stage build para Astro
FROM node:18-alpine AS base

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

# Servidor de producción con nginx
FROM nginx:alpine AS server
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]

# Target para solo construcción (para usar con volúmenes)
FROM builder AS build-only
CMD ["sh", "-c", "npm run build && cp -r dist/* /app/output/ 2>/dev/null || cp -r dist /app/output/"]
