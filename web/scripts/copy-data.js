import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DATA_DIR = path.resolve(__dirname, '../../data');
const TARGET_DATA_DIR = path.resolve(__dirname, '../src/data');

console.log('🔄 Sincronizando datos del scraping...');
console.log(`📂 Origen: ${SOURCE_DATA_DIR}`);
console.log(`📂 Destino: ${TARGET_DATA_DIR}`);

// Crear directorio de datos si no existe
if (!fs.existsSync(TARGET_DATA_DIR)) {
    fs.mkdirSync(TARGET_DATA_DIR, { recursive: true });
    console.log(`📁 Directorio creado: ${TARGET_DATA_DIR}`);
}

// Verificar que el directorio origen existe
if (!fs.existsSync(SOURCE_DATA_DIR)) {
    console.error(`❌ Directorio origen no encontrado: ${SOURCE_DATA_DIR}`);
    process.exit(1);
}

// Copiar todos los archivos JSON de data
const dataFiles = fs.readdirSync(SOURCE_DATA_DIR).filter(file => file.endsWith('.json'));

if (dataFiles.length === 0) {
    console.warn('⚠️  No se encontraron archivos JSON en el directorio de datos.');
    process.exit(0);
}

dataFiles.forEach(file => {
    const sourcePath = path.join(SOURCE_DATA_DIR, file);
    const targetPath = path.join(TARGET_DATA_DIR, file);
    
    try {
        // Verificar que el archivo origen es válido JSON
        const content = fs.readFileSync(sourcePath, 'utf8');
        JSON.parse(content); // Validar JSON
        
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`✅ Copiado: ${file}`);
        
        // Mostrar información del archivo
        const stats = fs.statSync(sourcePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   📊 Tamaño: ${sizeKB} KB | Modificado: ${stats.mtime.toLocaleString('es-ES')}`);
        
    } catch (error) {
        console.error(`❌ Error copiando ${file}:`, error.message);
    }
});

console.log(`\n🎉 ${dataFiles.length} archivos de datos sincronizados correctamente.`);

// Verificar que existe el archivo principal de datos
const mainDataFile = path.join(TARGET_DATA_DIR, 'upslat-scrape-results.json');
if (fs.existsSync(mainDataFile)) {
    try {
        const data = JSON.parse(fs.readFileSync(mainDataFile, 'utf8'));
        console.log(`📈 Datos disponibles: ${data.data?.length || 0} atletas`);
        console.log(`🕒 Última actualización: ${new Date(data.timestamp).toLocaleString('es-ES')}`);
    } catch (error) {
        console.error('❌ Error leyendo datos principales:', error.message);
    }
}
