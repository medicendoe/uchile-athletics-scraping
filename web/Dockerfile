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
RUN npm run build

# Comando para copiar archivos construidos al volumen de salida
CMD ["sh", "-c", "cp -r /app/dist/* /app/output/ && echo 'Archivos estáticos generados en /app/output' && ls -la /app/output/"]