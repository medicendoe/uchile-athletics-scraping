interface IAthleteInput {
    name: string;
}

export default interface IUpslatInput {
    username: string;
    password: string;
    athletes: IAthleteInput[];
    maxRetries?: number;
    retryDelay?: number;
}