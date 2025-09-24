# Plataforma de Atletismo

Plataforma completa que incluye un scraper para obtener datos de atletas y una aplicación web Astro para generar páginas estáticas.

## Estructura del Proyecto

```
├── scraper/          # Servicio de scraping con Puppeteer
│   ├── Dockerfile
│   ├── src/
│   └── package.json
├── web/              # Aplicación web con Astro  
│   ├── Dockerfile
│   ├── src/
│   └── package.json
├── data/             # Datos compartidos entre servicios
├── dist/             # Páginas estáticas generadas
└── generate-static.sh # Script para generar páginas estáticas
```

## Uso Rápido

### 1. Configurar variables de entorno

Crea un archivo `.env` con las siguientes variables:

```bash
# Credenciales de Upslat
UPSLAT_USERNAME=tu_email@ejemplo.com
UPSLAT_PASSWORD=tu_contraseña

# Lista de atletas separados por comas con género
ATHLETES="Juan Pérez; M, María González; F, Carlos Silva; M"

# Lista de eventos a filtrar (opcional, separados por comas)
# Si se omite, se obtendrán todos los eventos
EVENTS="100 metros, 200 metros, 400 metros, 800 metros, 1.500 metros, Salto largo, Salto alto, Lanzamiento bala"

# Configuración
NODE_ENV=production
WEB_PORT=3000
```

### 2. Hacer scraping de datos
```bash
# Ejecutar el scraper para obtener datos de atletismo
docker compose up scraper
```

### 3. Generar páginas estáticas
```bash
# Opción A: Usar script (recomendado)
./generate-static.sh

# Opción B: Comando directo
docker compose run --rm web-builder
```

### 4. Servir páginas localmente (opcional)
```bash
# Ir a la carpeta de páginas generadas
cd dist

# Servir con Python
python3 -m http.server 8000

# O con Node.js
npx serve .
```

## Filtrado de Eventos

El scraper permite filtrar qué eventos deportivos obtener mediante la variable de entorno `EVENTS`. Esto es útil para:

- **Optimizar tiempo de scraping** - solo obtener datos de eventos relevantes
- **Reducir uso de ancho de banda** - menor transferencia de datos
- **Enfocar análisis** - concentrarse en disciplinas específicas

### Configuración de Filtros

```bash
# Ejemplo: Solo eventos de velocidad
EVENTS="100 metros, 200 metros, 400 metros"

# Ejemplo: Solo saltos
EVENTS="Salto largo, Salto alto, Salto triple, Salto con garrocha"

# Ejemplo: Solo lanzamientos
EVENTS="Lanzamiento bala, Lanzamiento disco, Lanzamiento martillo, Lanzamiento jabalina"

# Si no se especifica EVENTS, se obtienen todos los eventos disponibles
```

**Nota importante**: El filtrado es case-insensitive y utiliza coincidencias parciales. Por ejemplo, "100 metros" coincidirá con "100 metros" independientemente de las mayúsculas/minúsculas.

## Características de la Web

- **Página de inicio** con estadísticas generales y navegación
- **Rankings de todos los tiempos** - mejores marcas personales históricas
- **Rankings de temporada** - mejores marcas de la temporada actual  
- **Lista de atletas** - todos los atletas con sus estadísticas
- **Páginas individuales** - detalles completos de cada atleta
- **Navegación completa** - enlaces entre atletas desde cualquier página
- **Diseño responsive** - funciona en móviles y desktop
- **Filtrado de eventos** - solo procesa los eventos especificados en la configuración

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run scrape` | Ejecutar solo el scraper |
| `npm run build:web` | Construir solo la web |
| `npm run serve` | Levantar servidor web |
| `npm run stop` | Detener servidor web |
| `npm run deploy` | Proceso completo automatizado |
| `npm run clean` | Limpiar contenedores y cache |
| `npm run logs:scraper` | Ver logs del scraper |
| `npm run logs:web` | Ver logs de construcción web |
| `npm run logs:server` | Ver logs del servidor |

## Desarrollo Local

### Scraper
```bash
cd scraper
npm install
npm run dev
```

### Web
```bash
cd web  
npm install
npm run dev
```

## Arquitectura

- **Scraper**: Container independiente que ejecuta Puppeteer y guarda datos en `./data`
- **Web Builder**: Container que toma datos de `./data` y construye sitio estático en `./dist` 
- **Web Server**: Container nginx que sirve el sitio desde `./dist`

## Profiles de Docker Compose

- `scraper`: Solo ejecuta el scraping
- `web`: Solo construye la aplicación web
- `server`: Solo levanta el servidor web
