export interface IPB {
    event: string;
    record: {
        wind: string;
        measurement: string;
    }
    date: string;
}

export interface IPBScrapeResult {
    name: string;
    UpslatId: string;
    personalBests: IPB[];
    seasonalBests: IPB[];
}