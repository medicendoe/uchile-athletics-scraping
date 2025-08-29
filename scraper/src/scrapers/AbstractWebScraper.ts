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
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--aggressive-cache-discard',
                '--memory-pressure-off'
            ],
            defaultViewport: null,
            timeout: 30000
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
        console.log(`Working directory: ${process.cwd()}`);
        console.log(`Target data directory: ${dataDir}`);
        
        if (!fs.existsSync(dataDir)) {
            console.log('Data directory does not exist, creating...');
            fs.mkdirSync(dataDir, { recursive: true });
            console.log('Data directory created successfully');
        } else {
            console.log('Data directory already exists');
        }
        
        // Verificar permisos del directorio
        try {
            fs.accessSync(dataDir, fs.constants.W_OK);
            console.log('Data directory is writable');
        } catch (error) {
            console.error('Data directory is not writable:', error);
            throw new Error(`Cannot write to data directory: ${dataDir}`);
        }
        
        const filepath = path.join(dataDir, filename);
        console.log(`Attempting to write file: ${filepath}`);
        
        try {
            fs.writeFileSync(filepath, JSON.stringify(this.data, null, 2));
            console.log(`Resultados guardados en: ${filepath}`);
            
            // Verificar que el archivo se creó correctamente
            if (fs.existsSync(filepath)) {
                const stats = fs.statSync(filepath);
                console.log(`File created successfully, size: ${stats.size} bytes`);
            } else {
                throw new Error('File was not created despite no error thrown');
            }
        } catch (error) {
            console.error('Error writing file:', error);
            throw error;
        }
    }

}