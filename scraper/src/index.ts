import "dotenv/config";
import { IWebScraper } from "./scrapers/interfaces";
import UpslatScraper from "./scrapers/upslat/UpslatScraper";

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

    // Parse athletes with gender information
    const athletesWithGender = process.env.ATHLETES ? 
        process.env.ATHLETES.split(',').map(athleteString => {
            const trimmed = athleteString.trim();
            const parts = trimmed.split(';');
            if (parts.length >= 2) {
                const name = parts[0].trim();
                const gender = parts[1].trim() as 'M' | 'F';
                return { name, gender };
            }
            return { name: trimmed };
        }) : [];

    // Parse events and convert to uppercase for filtering
    const allowedEvents = process.env.EVENTS ? 
        process.env.EVENTS.split(',').map(event => event.trim().toUpperCase()) : [];

    const scraper: IWebScraper = new UpslatScraper({
        username: process.env.UPSLAT_USERNAME || '',
        password: process.env.UPSLAT_PASSWORD || '',
        athletes: athletesWithGender,
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