# Usar una imagen base especial para Puppeteer
FROM ghcr.io/puppeteer/puppeteer:22.15.0

# Cambiar al usuario root temporalmente para instalar dependencias
USER root

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de Node.js
COPY package*.json ./
COPY tsconfig.json ./
COPY types/ ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY src/ ./src/

# Compilar TypeScript
RUN npm run build

# Configurar permisos para el usuario pptruser (ya existe en la imagen base)
RUN mkdir -p /home/pptruser/Downloads \
    && mkdir -p /home/pptruser/.cache/puppeteer \
    && mkdir -p /app/data

# Instalar Chrome browser para Puppeteer como usuario pptruser
RUN npx puppeteer browsers install chrome

# Exponer puerto (opcional, si necesitas un servidor web)
EXPOSE 3000

# Comando por defecto
CMD ["npm", "start"]
