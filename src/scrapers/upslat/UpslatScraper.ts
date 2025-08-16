import AbstractWebScraper from "../AbstratWebScraper";
import { Page } from "puppeteer";
import { IScrapeResult } from "../interfaces";
import { IUpslatInput, IPBScrapeResult, IPB } from "./interfaces";

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

    async searchAthlete(input: IUpslatInput): Promise<string> {

        try {
            await this.page.goto(`${this.baseUrl}`, { waitUntil: 'networkidle2' });

            await this.page.waitForSelector('input[name="s"]');

            await this.page.type('input[name="s"]', input.name, { delay: 100 });

            await Promise.all([
                this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
                this.page.click('button[type="submit"]')
            ]);

            await this.page.waitForSelector('.list-group a');
            
            const firstLinkHref = await this.page.$eval('.list-group a', (element) => {
                return element.getAttribute('href') || '';
            });

            console.log('Primer enlace encontrado:', firstLinkHref);

            return firstLinkHref.split('/').pop() || '';

        } catch (error) {
            console.error('Error en searchAthlete:', error);
            return '';
        }
    }

    async getSeasonPBs(athleteId: string): Promise<IPB[]> {
        try {

            let results: IPB[] = [];

            const url = `${this.baseUrl}/atleta/${athleteId}`;

            await this.page.goto(url, { waitUntil: 'networkidle2' });

            const seasonData = await this.page.evaluate(() => {

                const events = document.querySelectorAll('.tab-content div:nth-child(2) .panel-group');

                for (let eventElement of Array.from(events)) {

                    const eventName = eventElement.querySelector('.panel-heading h4 a')?.textContent?.trim() || '';

                    let best: IPB = {
                        event: eventName,
                        record: {
                            wind: '',
                            measurement: '',
                        },
                        date: ''
                    };

                    const records = eventElement.querySelectorAll('.panel-collapse .table-responsive .table tbody tr');

                    for (let recordElement of Array.from(records)) {
                        const cells = recordElement.querySelectorAll('td');
                        if (cells.length >= 7) {
                            const measurement = cells[0].textContent?.trim() || '';
                            const wind = cells[1].textContent?.trim() || '';
                            const date = cells[6].textContent?.trim() || '';

                            function isTimeImprovement(newTime: string, currentBest: string): boolean {
                                const newTimeParts = newTime.split(':').map(Number);
                                const currentBestParts = currentBest.split(':').map(Number);

                                if (newTimeParts.length > currentBestParts.length) {
                                    return false;
                                } else if (newTimeParts.length < currentBestParts.length) {
                                    return true;
                                }

                                for (let i = Math.min(newTimeParts.length, currentBestParts.length) - 1; i >= 0; i--) {
                                    if (newTimeParts[i] < currentBestParts[i]) {
                                        return true;
                                    } else if (newTimeParts[i] > currentBestParts[i]) {
                                        return false;
                                    }
                                }
                                return false;
                            }

                            if(measurement && (!best.record.measurement || isTimeImprovement(measurement, best.record.measurement)) && (Number(best.date.split(' ')[2]) == new Date().getFullYear())) {
                                best.record.measurement = measurement;
                                best.record.wind = wind;
                                best.date = date;
                            }
                        }
                    }

                    if (best.record.measurement) {
                        results.push(best);
                    }
                }
                
                return results;
            });

            return seasonData;

        } catch (error) {
            console.error('Error en getSeasonPBs:', error);
            throw new Error('No se pudo obtener los mejores registros de la temporada.');
        }
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