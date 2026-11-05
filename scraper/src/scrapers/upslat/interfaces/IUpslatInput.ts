export interface IAthleteInput {
    name: string;
    gender?: 'M' | 'F';
}

export interface IEventInput {
    name: string;
    gender: 'M' | 'F' | 'X';
}

export default interface IUpslatInput {
    username: string;
    password: string;
    athletes: IAthleteInput[];
    allowedEvents?: IEventInput[];
    maxRetries?: number;
    retryDelay?: number;
}
