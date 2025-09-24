interface IAthleteInput {
    name: string;
    gender?: 'M' | 'F';
}

export default interface IUpslatInput {
    username: string;
    password: string;
    athletes: IAthleteInput[];
    allowedEvents?: string[];
    maxRetries?: number;
    retryDelay?: number;
}