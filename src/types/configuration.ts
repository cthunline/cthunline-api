export interface Configuration {
    DEFAULT_ADMIN_NAME: string;
    DEFAULT_ADMIN_EMAIL: string;
    DEFAULT_ADMIN_PASSWORD: string;
    PORT: number;
    JWT_SECRET: string;
    COOKIE_SECRET: string;
    COOKIE_SECURE: boolean;
    LOG_ENABLED: boolean;
    LOG_DIR: string;
    CHECKPOINT_DISABLE: boolean;
    MONGO_URL: string;
    ASSET_DIR: string;
}

export type ConfigurationKey = keyof Configuration;

export type ConfigurationValueType = 'string' | 'number' | 'boolean' | 'path';

export type ConfigurationSchema = Record<ConfigurationKey, ConfigurationValueType>;

export const configurationSchema: ConfigurationSchema = {
    DEFAULT_ADMIN_NAME: 'string',
    DEFAULT_ADMIN_EMAIL: 'string',
    DEFAULT_ADMIN_PASSWORD: 'string',
    PORT: 'number',
    JWT_SECRET: 'string',
    COOKIE_SECRET: 'string',
    COOKIE_SECURE: 'boolean',
    LOG_ENABLED: 'boolean',
    LOG_DIR: 'string',
    CHECKPOINT_DISABLE: 'boolean',
    MONGO_URL: 'string',
    ASSET_DIR: 'string'
};

export const defaultConfiguration: Configuration = {
    DEFAULT_ADMIN_NAME: '',
    DEFAULT_ADMIN_EMAIL: '',
    DEFAULT_ADMIN_PASSWORD: '',
    PORT: 8080,
    JWT_SECRET: '',
    COOKIE_SECRET: '',
    COOKIE_SECURE: true,
    LOG_ENABLED: true,
    LOG_DIR: '',
    CHECKPOINT_DISABLE: true,
    MONGO_URL: '',
    ASSET_DIR: ''
};
