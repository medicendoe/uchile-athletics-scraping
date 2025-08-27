// Interfaces that match the scraper's data structure
export interface IPB {
    event: string;
    record: {
        wind: string;
        measurement: string;
    };
    date: string;
}

export interface IRankedPB {
    event: string;
    records: {
        athlete: string;
        wind: string;
        measurement: string;
        date: string;
    }[];
}

export interface IAthletePB {
    name: string;
    UpslatId: string;
    personalBests: IPB[];
    seasonalBests: IPB[];
}

export interface IPBScrapeResult {
    athletes: IAthletePB[];
    seasonalBests: IRankedPB[];
    allTimeBests: IRankedPB[];
}

export interface IScrapeResult {
    url: string;
    timestamp: string;
    data: IPBScrapeResult;
}

export interface AthleteStats {
    totalPBs: number;
    totalSeasonalBests: number;
    events: string[];
    bestEvent?: string;
}

// Type alias for individual athlete data (for backward compatibility)
export type IPBScrapeResultLegacy = IAthletePB;
