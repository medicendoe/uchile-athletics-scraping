# Atletismo Web Scraper

Un proyecto de web scraping usando TypeScript y Puppeteer, ejecutándose en Docker.

## Estructura del Proyecto

```
.
├── Dockerfile              # Configuración de Docker
├── docker-compose.yml      # Orquestación de contenedores
├── package.json            # Dependencias de Node.js
├── tsconfig.json          # Configuración de TypeScript
├── src/
│   └── index.ts           # Código principal del scraper
├── data/                  # Directorio para resultados (creado automáticamente)
└── README.md              # Este archivo
```

## Uso

### Desarrollo Local

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```

3. **Compilar TypeScript:**
   ```bash
   npm run build
   ```

### Uso con Docker

1. **Construir y ejecutar con docker-compose:**
   ```bash
   docker-compose up --build
   ```

2. **Ejecutar en segundo plano:**
   ```bash
   docker-compose up -d
   ```

3. **Ver logs:**
   ```bash
   docker-compose logs -f
   ```

4. **Detener:**
   ```bash
   docker-compose down
   ```

### Solo Docker (sin compose)

1. **Construir imagen:**
   ```bash
   docker build -t atletismo-scraper .
   ```

2. **Ejecutar contenedor:**
   ```bash
   docker run --rm -v $(pwd)/data:/app/data atletismo-scraper
   ```

## Configuración

### Variables de Entorno

- `NODE_ENV`: Entorno de ejecución (development/production)
- `PUPPETEER_EXECUTABLE_PATH`: Ruta al ejecutable de Chrome
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`: Evita descargar Chromium

### Personalización del Scraper

Edita `src/index.ts` para:

- Cambiar las URLs objetivo
- Modificar los selectores CSS
- Personalizar la lógica de extracción de datos
- Ajustar delays entre requests

## Características

- ✅ Ejecuta en contenedor Docker optimizado
- ✅ Soporte completo para Puppeteer
- ✅ Configuración de seguridad (usuario no root)
- ✅ TypeScript con tipos estrictos
- ✅ Manejo de errores robusto
- ✅ Resultados guardados en JSON
- ✅ Delays respetuosos entre requests

## Consideraciones de Ética y Legalidad

- Siempre respeta el archivo `robots.txt` del sitio web
- Implementa delays apropiados entre requests
- No sobrecargues los servidores objetivo
- Verifica los términos de servicio del sitio web
- Considera usar APIs públicas cuando estén disponibles

## Troubleshooting

### Error de Chrome/Chromium
Si tienes problemas con Chrome, verifica que las dependencias estén instaladas:
```bash
docker-compose exec web-scraper google-chrome-stable --version
```

### Problemas de Memoria
Si el contenedor se queda sin memoria, ajusta los límites en `docker-compose.yml`:
```yaml
deploy:
  resources:
    limits:
      memory: 2G
```

### Permisos de Archivos
Los resultados se guardan en `./data/` con permisos del usuario del contenedor.
