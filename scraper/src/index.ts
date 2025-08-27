import "dotenv/config";
import { IWebScraper } from "./scrapers/interfaces";
import UpslatScraper from "./scrapers/upslat/UpslatScraper";

function validateEnv() {
    const requiredEnvVars = [
        'UPSLAT_USERNAME',
        'UPSLAT_PASSWORD',
        'ATHLETES',
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

    const scraper: IWebScraper = new UpslatScraper({
        username: process.env.UPSLAT_USERNAME || '',
        password: process.env.UPSLAT_PASSWORD || '',
        athletes: process.env.ATHLETES ? process.env.ATHLETES.split(',').map(name => ({ name })) : []
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
        
    } catch (error) {
        console.error('Error en el proceso principal:', error);
    } finally {
        await scraper.close();
    }
}

// Ejecutar si este archivo es el punto de entrada
if (require.main === module) {
    main().catch(console.error);
}