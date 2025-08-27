import type { IPB, IAthletePB, IPBScrapeResult, IScrapeResult, AthleteStats, IRankedPB } from '../types';
import upslatData from '../data/upslat-scrape-results.json';

/**
 * Carga los datos del scraper desde el archivo JSON
 */
export function loadScrapingData(): IScrapeResult {
    try {
        // Usar import estático para mejor compatibilidad con Astro
        const data = upslatData as IScrapeResult;
        
        // Validar que los datos tienen la estructura correcta
        if (!data || !data.data || !data.data.athletes || !Array.isArray(data.data.athletes)) {
            console.warn('Datos inválidos, usando estructura vacía');
            return {
                url: 'https://atletismo.usplat.cl',
                timestamp: new Date().toISOString(),
                data: {
                    athletes: [],
                    seasonalBests: [],
                    allTimeBests: []
                }
            };
        }
        
        return data;
    } catch (error) {
        console.error('Error cargando datos:', error);
        // Retornar estructura vacía pero válida
        return {
            url: 'https://atletismo.usplat.cl',
            timestamp: new Date().toISOString(),
            data: {
                athletes: [],
                seasonalBests: [],
                allTimeBests: []
            }
        };
    }
}

/**
 * Obtiene estadísticas de un atleta
 */
export function getAthleteStats(athlete: IAthletePB): AthleteStats {
    const events = new Set<string>();
    
    athlete.personalBests.forEach(pb => events.add(pb.event));
    athlete.seasonalBests.forEach(sb => events.add(sb.event));
    
    return {
        totalPBs: athlete.personalBests.length,
        totalSeasonalBests: athlete.seasonalBests.length,
        events: Array.from(events),
        bestEvent: getMostFrequentEvent(athlete)
    };
}

/**
 * Obtiene el evento más frecuente de un atleta
 */
function getMostFrequentEvent(athlete: IAthletePB): string | undefined {
    const eventCount = new Map<string, number>();
    
    [...athlete.personalBests, ...athlete.seasonalBests].forEach(record => {
        eventCount.set(record.event, (eventCount.get(record.event) || 0) + 1);
    });
    
    let mostFrequent = '';
    let maxCount = 0;
    
    eventCount.forEach((count, event) => {
        if (count > maxCount) {
            maxCount = count;
            mostFrequent = event;
        }
    });
    
    return mostFrequent || undefined;
}

/**
 * Convierte una marca de tiempo a formato legible
 */
export function formatTime(measurement: string): string {
    if (!measurement || measurement === 'NM') return measurement;
    
    // Para tiempos (contienen ':')
    if (measurement.includes(':')) {
        return measurement;
    }
    
    // Para distancias y otros
    const num = parseFloat(measurement);
    if (isNaN(num)) return measurement;
    
    return num.toFixed(2);
}

/**
 * Convierte viento a formato legible
 */
export function formatWind(wind: string): string {
    if (!wind) return '';
    return wind.startsWith('+') || wind.startsWith('-') ? wind : `+${wind}`;
}

/**
 * Convierte fecha a formato legible
 */
export function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    
    try {
        // Asumiendo formato "DD MMM YYYY" en español
        const months: { [key: string]: string } = {
            'Ene': '01', 'Feb': '02', 'Mar': '03', 'Abr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Ago': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dic': '12'
        };
        
        const parts = dateStr.split(' ');
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = months[parts[1]] || '01';
            const year = parts[2];
            
            const date = new Date(`${year}-${month}-${day}`);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    } catch (error) {
        console.error('Error formateando fecha:', error);
    }
    
    return dateStr;
}

/**
 * Obtiene todos los eventos únicos
 */
export function getAllEvents(athletes: IAthletePB[]): string[] {
    const events = new Set<string>();
    
    athletes.forEach(athlete => {
        athlete.personalBests.forEach(pb => events.add(pb.event));
        athlete.seasonalBests.forEach(sb => events.add(sb.event));
    });
    
    return Array.from(events).sort();
}

/**
 * Filtra atletas por evento
 */
export function getAthletesByEvent(athletes: IAthletePB[], event: string): IAthletePB[] {
    return athletes.filter(athlete => 
        athlete.personalBests.some(pb => pb.event === event) ||
        athlete.seasonalBests.some(sb => sb.event === event)
    );
}

/**
 * Compara dos marcas para determinar cuál es mejor
 */
export function compareMeasurements(measurement1: string, measurement2: string, isTime: boolean = true): number {
    if (!measurement1 || measurement1 === 'NM') return 1;
    if (!measurement2 || measurement2 === 'NM') return -1;
    
    const parseTime = (time: string): number => {
        if (time.includes(':')) {
            const parts = time.split(':').map(p => parseFloat(p));
            return parts.reduce((acc, part, index) => acc + part * Math.pow(60, parts.length - 1 - index), 0);
        }
        return parseFloat(time);
    };
    
    const value1 = parseTime(measurement1);
    const value2 = parseTime(measurement2);
    
    if (isNaN(value1)) return 1;
    if (isNaN(value2)) return -1;
    
    // Para tiempos, menor es mejor; para distancias, mayor es mejor
    return isTime ? value1 - value2 : value2 - value1;
}

/**
 * Obtiene todos los eventos únicos de los rankings
 */
export function getAllEventsFromRankings(seasonalBests: IRankedPB[], allTimeBests: IRankedPB[]): string[] {
    const events = new Set<string>();
    
    seasonalBests.forEach(ranking => events.add(ranking.event));
    allTimeBests.forEach(ranking => events.add(ranking.event));
    
    return Array.from(events).sort();
}

/**
 * Obtiene el mejor ranking para un evento específico
 */
export function getRankingByEvent(rankings: IRankedPB[], event: string): IRankedPB | undefined {
    return rankings.find(ranking => ranking.event === event);
}

/**
 * Obtiene todos los atletas únicos de los datos
 */
export function getAllUniqueAthletes(athletes: IAthletePB[]): string[] {
    return athletes.map(athlete => athlete.name).sort();
}

/**
 * Busca un atleta por ID de Usplat
 */
export function getAthleteById(athletes: IAthletePB[], upslatId: string): IAthletePB | undefined {
    return athletes.find(athlete => athlete.UpslatId === upslatId);
}

/**
 * Busca atletas por nombre (búsqueda parcial)
 */
export function searchAthletesByName(athletes: IAthletePB[], searchTerm: string): IAthletePB[] {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return athletes.filter(athlete => 
        athlete.name.toLowerCase().includes(lowerSearchTerm)
    );
}
