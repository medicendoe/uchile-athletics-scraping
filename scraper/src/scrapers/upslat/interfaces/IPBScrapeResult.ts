export interface IPB {
    event: string;
    record: {
        wind: string;
        measurement: string;
    }
    date: string;
}

export interface IRankedPB {
    event: string;
    records: {
        athlete: string;
        wind: string;
        measurement: string;
        date: string;
        gender?: 'M' | 'F';
    }[];
}

export interface IGenderSeparatedRankings {
    men: IRankedPB[];
    women: IRankedPB[];
    mixed: IRankedPB[];
}

export interface IAthletePB {
    name: string;
    UpslatId: string;
    gender?: 'M' | 'F';
    personalBests: IPB[];
    seasonalBests: IPB[];
}

export interface IPBScrapeResult {
    athletes: IAthletePB[];
    seasonalBests: IGenderSeparatedRankings;
    allTimeBests: IGenderSeparatedRankings;
}