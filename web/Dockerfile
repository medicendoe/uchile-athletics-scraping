# Build para Astro - Solo generación estática
FROM node:18-alpine
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm ci

# Copiar código fuente
COPY . .

# Crear directorio de datos y archivo por defecto
RUN mkdir -p ./src/data && \
    echo '{"url":"https://atletismo.usplat.cl","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'","data":{"athletes":[],"seasonalBests":[],"allTimeBests":[]}}' > ./src/data/upslat-scrape-results.json

# Si existe el archivo de datos en el volumen, copiarlo
RUN if [ -f "/tmp/data/upslat-scrape-results.json" ]; then \
        cp /tmp/data/upslat-scrape-results.json ./src/data/; \
        echo "Datos copiados desde volumen"; \
    else \
        echo "Usando datos por defecto"; \
    fi

# Construir sitio estático
RUN npm run build

# Comando para copiar archivos construidos al volumen de salida
CMD ["sh", "-c", "cp -r /app/dist/* /app/output/ && echo 'Archivos estáticos generados en /app/output' && ls -la /app/output/"]