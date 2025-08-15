import AbstractWebScraper from "../AbstratWebScraper";
import { Page } from "puppeteer";
import { IScrapeResult } from "../interfaces";
import { IUpslatInput, IPBScrapeResult } from "./interfaces";

export default class UpslatScraper extends AbstractWebScraper<IPBScrapeResult[]> {

    
    protected input: IUpslatInput[];
    protected page!: Page;
    protected baseUrl: string = 'https://atletismo.usplat.cl';

    constructor(input: IUpslatInput[]) {
        super();
        this.input = input;
        this.data = {
            url: this.baseUrl,
            timestamp: new Date().toISOString(),
            data: []
        }
    }

    async login(email: string, password: string): Promise<void> {
        
        console.log('Iniciando sesión en Upslat...');
        const page = await this.browser.newPage();
        try {
            await page.setViewport({ width: 1920, height: 1080 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
            await page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle2' });
            
            await page.waitForSelector('input[name="email"]');
            await page.waitForSelector('input[name="password"]');

            await page.type('input[name="email"]', email, { delay: 100 });
            await page.type('input[name="password"]', password, { delay: 100 });

            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
                page.click('button[type="submit"]')
            ]);

            const currentUrl = page.url();
            if (currentUrl.includes('login')) {
                throw new Error('No se pudo iniciar sesión en Upslat. Verifica tus credenciales.');
            }

        } catch (error) {
            console.error('Error en el inicio de sesión:', error);
            await page.close();
            throw new Error('No se pudo acceder a la página de inicio de sesión de Upslat.');
        }

        console.log('Sesión iniciada correctamente en Upslat');

        if (this.page) {
            await this.page.close();
        }
        this.page = page;
    }

    async scrape(): Promise<IScrapeResult<IPBScrapeResult[]>> {
        super.scrape();

        if (!this.page) {
            throw new Error('No se ha inicializado la página. Llama a login() primero.');
        }

        await this.page.close();
        return this.data;
    }
}