import puppeteer, { Browser } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { IScrapeResult, IWebScraper } from "./interfaces";

export default abstract class AbstractWebScraper<T> implements IWebScraper<T> {

    protected browser!: Browser;
    protected data!: IScrapeResult<T>;

    async initialize(): Promise<void> {
        console.log('Inicializando navegador...');
        
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ]
        });
        
        console.log('Navegador inicializado correctamente');
    }

    async scrape(): Promise<any> {
        if (!this.browser) {
            throw new Error('El navegador no está inicializado. Llama a initialize() primero.');
        }
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            console.log('Navegador cerrado');
        }
    }

    async saveResults(filename: string): Promise<void> {
        if (!this.data) {
            throw new Error('No hay datos para guardar. Asegúrate de haber hecho scraping primero.');
        }

        const dataDir = path.join(process.cwd(), 'data');
        
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        const filepath = path.join(dataDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(this.data, null, 2));
        console.log(`Resultados guardados en: ${filepath}`);
    }

}