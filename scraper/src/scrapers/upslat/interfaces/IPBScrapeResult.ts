export interface IPB {
    event: string;
    record: {
        wind: string;
        measurement: string;
    }
    date: string;
}

interface IRankedPB {
    event: string;
    records: {
        athlete: string;
        wind: string;
        measurement: string;
        date: string;
    }[];
}

interface IAthletePB {
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