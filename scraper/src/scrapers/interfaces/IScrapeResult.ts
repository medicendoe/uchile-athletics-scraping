export default interface IScrapeResult<T = any> {
    url: string;
    timestamp: string;
    data: T;
}