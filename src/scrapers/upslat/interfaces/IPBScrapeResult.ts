interface IPB {
    event: string;
    record: {
        unit: string;
        measurement: string;
    }
    date: string;
}

export default interface IPBScrapeResult {
    name: string;
    UpslatId: string;
    personalBests: IPB[];
}