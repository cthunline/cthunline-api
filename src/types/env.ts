export const locales = ['fr', 'en'];

export interface EnvData {
    DEFAULT_ADMIN_NAME: string;
    DEFAULT_ADMIN_EMAIL: string;
    DEFAULT_ADMIN_PASSWORD: string;
    REGISTRATION_ENABLED: boolean;
    INVITATION_ENABLED: boolean;
    DEFAULT_THEME: string;
    DEFAULT_LOCALE: string;
    ENVIRONMENT: string;
    PORT: number;
    JWT_SECRET: string;
    COOKIE_SECRET: string;
    COOKIE_SECURE: boolean;
    LOG_ENABLED: boolean;
    LOG_DIR: string;
    REVERSE_PROXY: boolean;
    RL_WINDOW_DURATION: number;
    RL_MAX_REQUESTS: number;
    DATABASE_URL: string;
    ASSET_DIR: string;
    ASSET_MAX_SIZE_MB: number;
    ASSET_MAX_SIZE_MB_PER_FILE: number;
    PORTRAIT_MAX_SIZE_MB: number;
}

export type EnvValueType = 'string' | 'number' | 'boolean' | 'path';

export interface EnvValueData {
    type: EnvValueType;
    required: boolean;
    filter?: any[];
}

export type EnvSchema<EnvDataType> = Record<keyof EnvDataType, EnvValueData>;
