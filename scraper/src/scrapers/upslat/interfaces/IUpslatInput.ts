interface IAthleteInput {
    name: string;
}

export default interface IUpslatInput {
    username: string;
    password: string;
    athletes: IAthleteInput[];
    maxRetries?: number; // Número máximo de reintentos (default: 3)
    retryDelay?: number; // Delay entre reintentos en ms (default: 2000)
}