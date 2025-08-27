declare global {
    namespace NodeJS {
        interface ProcessEnv {
            UPSLAT_USERNAME: string;
            UPSLAT_PASSWORD: string;
            ATHLETES: string;
            NODE_ENV: 'development' | 'production' | 'test';
        }
    }
}

export {};