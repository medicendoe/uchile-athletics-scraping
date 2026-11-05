import "dotenv/config";
import { IWebScraper } from "./scrapers/interfaces";
import UpslatScraper from "./scrapers/upslat/UpslatScraper";
import { IAthleteInput, IEventInput } from "./scrapers/upslat/interfaces";

/**
 * Parsea una variable de entorno con formato tipo CSV:
 * ';' separa filas y ',' separa columnas. Ej: "Nombre Uno,M;Nombre Dos,F"
 */
function parseRows(value?: string): string[][] {
    if (!value) return [];
    return value
        .split(';')
        .map(row => row.split(',').map(column => column.trim()))
        .filter(columns => columns[0]);
}

function validateEnv() {
    const requiredEnvVars = [
        'UPSLAT_USERNAME',
        'UPSLAT_PASSWORD',
        'ATHLETES',
        'EVENTS',
        'NODE_ENV'
    ];

    for (const varName of requiredEnvVars) {
        if (!process.env[varName]) {
            throw new Error(`Missing environment variable: ${varName}`);
        }
    }
}

async function main() {

    validateEnv();

    // Formato tipo CSV: ';' separa filas y ',' separa columnas (nombre,género)
    const athletes: IAthleteInput[] = parseRows(process.env.ATHLETES).map(([name, gender]) => {
        const normalizedGender = gender?.toUpperCase();
        if (normalizedGender === 'M' || normalizedGender === 'F') {
            return { name, gender: normalizedGender };
        }
        if (gender) {
            console.warn(`Género inválido "${gender}" para el atleta "${name}". Se ignorará el género.`);
        }
        return { name };
    });

    // Eventos en mayúsculas para el filtrado. Género: M, F o X (ambos). Sin género -> X
    const allowedEvents: IEventInput[] = parseRows(process.env.EVENTS).map(([name, gender]) => {
        const normalizedGender = gender?.toUpperCase();
        if (normalizedGender === 'M' || normalizedGender === 'F' || normalizedGender === 'X') {
            return { name: name.toUpperCase(), gender: normalizedGender };
        }
        if (gender) {
            console.warn(`Género inválido "${gender}" para el evento "${name}". Se usará X (ambos).`);
        }
        return { name: name.toUpperCase(), gender: 'X' };
    });

    const scraper: IWebScraper = new UpslatScraper({
        username: process.env.UPSLAT_USERNAME || '',
        password: process.env.UPSLAT_PASSWORD || '',
        athletes: athletes,
        allowedEvents: allowedEvents,
        maxRetries: 15,
        retryDelay: 3000,
    });

    try {

        console.log('Iniciando el scraper de Upslat...');
        await scraper.initialize();

        console.log('Scraping de datos de Upslat...');
        const result = await scraper.scrape();

        console.log('Datos scrapeados:', result);

        console.log('Guardando resultados en upslat-scrape-results.json...');
        await scraper.saveResults('upslat-scrape-results.json');

        console.log('Resultados guardados correctamente.');

        console.log('Cerrando el scraper...');
        await scraper.close();
        
        console.log('Proceso completado exitosamente.');
        process.exit(0);
        
    } catch (error) {
        console.error('Error en el proceso principal:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
        process.exit(1);
    } finally {
        await scraper.close();
    }
}

// Ejecutar si este archivo es el punto de entrada
if (require.main === module) {
    main().catch(console.error);
}