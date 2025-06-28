# Usar una imagen base especial para Puppeteer
FROM ghcr.io/puppeteer/puppeteer:22.15.0

# Cambiar al usuario root temporalmente para instalar dependencias
USER root

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de Node.js
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias
RUN npm ci

# Instalar Chrome browser para Puppeteer
RUN npx puppeteer browsers install chrome

# Copiar código fuente
COPY src/ ./src/

# Compilar TypeScript
RUN npm run build

# Configurar permisos para el usuario pptruser (ya existe en la imagen base)
RUN mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Cambiar a usuario no root
USER pptruser

# Exponer puerto (opcional, si necesitas un servidor web)
EXPOSE 3000

# Comando por defecto
CMD ["npm", "start"]
