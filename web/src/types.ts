export interface IPB {
    event: string;
    record: {
        wind: string;
        measurement: string;
    };
    date: string;
}

export interface IPBScrapeResult {
    name: string;
    UpslatId: string;
    personalBests: IPB[];
    seasonalBests: IPB[];
}

export interface IScrapeResult {
    url: string;
    timestamp: string;
    data: IPBScrapeResult[];
}

export interface AthleteStats {
    totalPBs: number;
    totalSeasonalBests: number;
    events: string[];
    bestEvent?: string;
}
