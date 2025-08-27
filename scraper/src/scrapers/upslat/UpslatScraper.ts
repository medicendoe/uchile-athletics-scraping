import AbstractWebScraper from "../AbstractWebScraper";
import { Page } from "puppeteer";
import { IScrapeResult } from "../interfaces";
import { IUpslatInput, IPBScrapeResult, IPB } from "./interfaces";

export default class UpslatScraper extends AbstractWebScraper<IPBScrapeResult> {

    
    protected input: IUpslatInput;
    protected page!: Page;
    protected baseUrl: string = 'https://atletismo.usplat.cl';

    constructor(input: IUpslatInput) {
        super();
        this.input = input;
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

    async searchAthlete(name: string): Promise<string> {
        console.log(`Buscando atleta: ${name}`);

        try {
            await this.page.goto(`${this.baseUrl}`, { waitUntil: 'networkidle2' });

            await this.page.waitForSelector('input[name="s"]');

            await this.page.type('input[name="s"]', name, { delay: 100 });

            await Promise.all([
                this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 100000 }),
                this.page.click('button[type="submit"]')
            ]);

            await this.page.waitForSelector('.list-group a');
            
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

            await this.page.goto(url, { waitUntil: 'networkidle2' });

            const seasonData = await this.page.evaluate(() => {

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

                let results: IPB[] = []; // Mover esta declaración aquí
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
                
                return results; // Agregar esta línea al final del evaluate
            });

            return seasonData; // Cambiar de 'results' a 'seasonData'

        } catch (error) {
            console.error('Error en getSeasonPBs:', error);
            throw new Error('No se pudo obtener los mejores registros de la temporada.');
        }
    }

    async getPersonalPBs(athleteId: string): Promise<IPB[]> {
        console.log(`Obteniendo mejores registros personales para el atleta ID: ${athleteId}`);
        try {

            const url = `${this.baseUrl}/atleta/${athleteId}`;

            await this.page.goto(url, { waitUntil: 'networkidle2' });

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