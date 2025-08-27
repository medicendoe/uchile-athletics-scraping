import IScrapeResult from './IScrapeResult';

export default interface IWebScraper<T = any> {
    initialize(): Promise<void>;
    scrape(): Promise<IScrapeResult<T>>;
    close(): Promise<void>;
    saveResults(filename: string): Promise<void>;
}