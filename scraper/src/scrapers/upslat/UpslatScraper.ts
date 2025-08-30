import AbstractWebScraper from "../AbstractWebScraper";
import { Page } from "puppeteer";
import { IScrapeResult } from "../interfaces";
import { IUpslatInput, IPBScrapeResult, IPB } from "./interfaces";

export default class UpslatScraper extends AbstractWebScraper<IPBScrapeResult> {

    
    protected input: IUpslatInput;
    protected page!: Page;
    protected baseUrl: string = 'https://atletismo.usplat.cl';
    private maxRetries: number;
    private retryDelay: number;

    constructor(input: IUpslatInput) {
        super();
        this.input = input;
        this.maxRetries = input.maxRetries || 5;
        this.retryDelay = input.retryDelay || 1000;
        this.data = {
            url: this.baseUrl,
            timestamp: new Date().toISOString(),
            data: {
                athletes: [],
                seasonalBests: [],
                allTimeBests: []
            }
        }
    }

    /**
     * Método helper para reintentar operaciones que pueden fallar por timeout
     */
    private async retryOperation<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
        let lastError: Error;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`${operationName} - Intento ${attempt}/${this.maxRetries}`);
                return await operation();
            } catch (error) {
                lastError = error as Error;
                const errorMessage = lastError.message.toLowerCase();
                
                if (errorMessage.includes('timeout') || errorMessage.includes('navigation')) {
                    console.warn(`${operationName} - Timeout en intento ${attempt}:`, lastError.message);
                } else if (errorMessage.includes('net::err')) {
                    console.warn(`${operationName} - Error de red en intento ${attempt}:`, lastError.message);
                } else {
                    console.warn(`${operationName} - Error en intento ${attempt}:`, lastError.message);
                }
                
                if (attempt < this.maxRetries) {
                    console.log(`Esperando ${this.retryDelay}ms antes del siguiente intento...`);
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                } else {
                    console.error(`${operationName} - Todos los intentos (${this.maxRetries}) han fallado`);
                }
            }
        }
        
        throw lastError!;
    }

    /**
     * Verifica si la página actual es válida y no ha perdido la sesión
     */
    private async checkPageStatus(): Promise<boolean> {
        try {
            const currentUrl = this.page.url();
            if (currentUrl.includes('login')) {
                console.warn('La sesión se ha perdido, es necesario hacer login nuevamente');
                return false;
            }
            return true;
        } catch (error) {
            console.warn('Error al verificar el estado de la página:', error);
            return false;
        }
    }

    async login(email: string, password: string): Promise<void> {
        
        console.log('Iniciando sesión en Upslat...');
        const page = await this.browser.newPage();
        
        try {
            await page.setViewport({ width: 1920, height: 1080 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const resourceType = req.resourceType();
                if(resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font' || resourceType === 'media') {
                    req.abort();
                } else {
                    req.continue();
                }
            });
        
            await this.retryOperation(async () => {
                await page.goto(`${this.baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
            }, 'Navegación a página de login');
            
            await page.waitForSelector('input[name="email"]', { timeout: 10000 });
            await page.waitForSelector('input[name="password"]', { timeout: 10000 });

            await page.type('input[name="email"]', email, { delay: 50 }); // Reducir delay de escritura
            await page.type('input[name="password"]', password, { delay: 50 });

            await this.retryOperation(async () => {
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
                    page.click('button[type="submit"]')
                ]);
            }, 'Envío de formulario de login');

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

    async searchAthlete(name: string): Promise<string> {
        console.log(`Buscando atleta: ${name}`);

        try {
            await this.retryOperation(async () => {
                await this.page.goto(`${this.baseUrl}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
            }, `Navegación a página principal para buscar ${name}`);

            await this.page.waitForSelector('input[name="s"]', { timeout: 10000 });

            await this.page.type('input[name="s"]', name, { delay: 50 }); // Reducir delay

            await this.retryOperation(async () => {
                await Promise.all([
                    this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
                    this.page.click('button[type="submit"]')
                ]);
            }, `Búsqueda de atleta ${name}`);

            await this.page.waitForSelector('.list-group a', { timeout: 10000 });
            
            const firstLinkHref = await this.page.$eval('.list-group a', (element) => {
                return element.getAttribute('href') || '';
            });

            return firstLinkHref.split('/').pop() || '';

        } catch (error) {
            console.error('Error en searchAthlete:', error);
            return '';
        }
    }

    parseTimeOrDistance(value: string): number {
        if (value.includes(':')) {
            const parts = value.split(':').map(Number);
            if (parts.length === 2) return parts[0] * 60 + parts[1];
            if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
            else throw new Error('Formato de tiempo no reconocido: ' + value);
        } else {
            return parseFloat(value);
        }
    }

    async getSeasonPBs(athleteId: string): Promise<IPB[]> {
        console.log(`Obteniendo mejores registros de la temporada para el atleta ID: ${athleteId}`);
        try {

            const url = `${this.baseUrl}/atleta/${athleteId}`;

            await this.retryOperation(async () => {
                await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
            }, `Navegación a página del atleta ${athleteId} para registros de temporada`);

            const seasonData = await this.page.evaluate(() => {

                function isTimeImprovement(newTime: string, currentBest: string): boolean {
                    const newTimeParts = newTime.split(':').map(Number);
                    const currentBestParts = currentBest.split(':').map(Number);

                    if (newTimeParts.length > currentBestParts.length) {
                        return false;
                    } else if (newTimeParts.length < currentBestParts.length) {
                        return true;
                    }

                    for (let i = 0; i < Math.min(newTimeParts.length, currentBestParts.length); i++) {
                        if (newTimeParts[i] < currentBestParts[i]) {
                            return true;
                        } else if (newTimeParts[i] > currentBestParts[i]) {
                            return false;
                        }
                    }
                    return false;
                }

                let results: IPB[] = [];
                const events = document.querySelectorAll('.tab-content div:nth-child(2) .panel-group .panel-primary');

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
                            if (measurement === 'DNS' || measurement === 'DNF' || measurement === 'DQ' || measurement === 'NS' || measurement === 'NR' || measurement === 'NM') {
                                continue;
                            }
                            const wind = cells[1].textContent?.trim() || '';
                            const date = cells[6].textContent?.trim() || '';

                            const recordYear = parseInt(date.split(' ')[2] || '0');
                            const currentYear = new Date().getFullYear();

                            if (recordYear !== currentYear) break;
                            if(measurement && (!best.record.measurement || isTimeImprovement(measurement, best.record.measurement))) {
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

    async getPersonalPBs(athleteId: string): Promise<IPB[]> {
        console.log(`Obteniendo mejores registros personales para el atleta ID: ${athleteId}`);
        try {

            const url = `${this.baseUrl}/atleta/${athleteId}`;

            await this.retryOperation(async () => {
                await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
            }, `Navegación a página del atleta ${athleteId} para registros personales`);

            const personalData = await this.page.evaluate(() => {

                let results: IPB[] = [];

                const events = document.querySelectorAll('.tab-content div:nth-child(1) .panel .panel-body .table-responsive .table tbody tr');

                for (let eventElement of Array.from(events)) {
                    const data = Array.from(eventElement.querySelectorAll('td'));

                    results.push({
                        event: data[0].textContent?.trim() || '',
                        record: {
                            wind: data[2].textContent?.trim() || '',
                            measurement: data[1].textContent?.trim() || '',
                        },
                        date: data[7].textContent?.trim() || ''
                    });
                }

                return results;
            });

            return personalData;

        } catch (error) {
            console.error('Error en getPersonalPBs:', error);
            throw new Error('No se pudo obtener los mejores registros personales.');
        }
    }

    async scrape(): Promise<IScrapeResult<IPBScrapeResult>> {
        super.scrape();

        await this.login(this.input.username, this.input.password);

        if (!this.page) {
            throw new Error('No se ha inicializado la página. Llama a login() primero.');
        }

        for( const athlete of this.input.athletes ) {
            const athleteId = await this.searchAthlete(athlete.name);

            if (!athleteId) {
                console.warn(`No se encontró el atleta: ${athlete.name}`);
                continue;
            }

            const personalBests = await this.getPersonalPBs(athleteId);
            const seasonalBests = await this.getSeasonPBs(athleteId);

            this.data.data.athletes.push({
                name: athlete.name,
                UpslatId: athleteId,
                personalBests: personalBests,
                seasonalBests: seasonalBests
            });
        }

        for( const athlete of this.data.data.athletes ) {
            if (athlete.personalBests.length > 0) {
                for( const pb of athlete.personalBests ) {
                    let existingEvent = this.data.data.allTimeBests.find((event) => event.event === pb.event);

                    if (!existingEvent) {
                        existingEvent = {
                            event: pb.event,
                            records: []
                        };
                        this.data.data.allTimeBests.push(existingEvent);
                    }
                    
                    const existingRecord = existingEvent.records.find(record => record.athlete === athlete.name);
                    if (!existingRecord) {
                        existingEvent.records.push({
                            athlete: athlete.name,
                            measurement: pb.record.measurement,
                            wind: pb.record.wind,
                            date: pb.date
                        });
                    }
                }
            }

            if (athlete.seasonalBests.length > 0) {
                for( const sb of athlete.seasonalBests ) {
                    let existingEvent = this.data.data.seasonalBests.find((event) => event.event === sb.event);
                    
                    if (!existingEvent) {
                        existingEvent = {
                            event: sb.event,
                            records: []
                        };
                        this.data.data.seasonalBests.push(existingEvent);
                    }
                    
                    const existingRecord = existingEvent.records.find(record => record.athlete === athlete.name);
                    if (!existingRecord) {
                        existingEvent.records.push({
                            athlete: athlete.name,
                            measurement: sb.record.measurement,
                            wind: sb.record.wind,
                            date: sb.date
                        });
                    }
                }
            }
        }

        for (const event of [...this.data.data.seasonalBests, ...this.data.data.allTimeBests]) {
            const isFieldEvent = event.event.toLowerCase().includes('lanzamiento') || 
                                event.event.toLowerCase().includes('salto');
            
            event.records.sort((a, b) => {
                const measurementA = this.parseTimeOrDistance(a.measurement);
                const measurementB = this.parseTimeOrDistance(b.measurement);
                
                if (isFieldEvent) {
                    return measurementB - measurementA;
                } else {
                    return measurementA - measurementB;
                }
            });
        }

        await this.page.close();
        return this.data;
    }
}