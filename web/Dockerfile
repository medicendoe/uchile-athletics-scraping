# Build para Astro - Solo generación estática
FROM node:18-alpine
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm ci

# Copiar código fuente
COPY . .

# Crear directorio de datos y archivo por defecto
RUN mkdir -p ./data 

# Construir sitio estático
CMD ["npm", "run", "build"]