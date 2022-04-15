export interface Configuration {
    DEFAULT_ADMIN_NAME: string;
    DEFAULT_ADMIN_EMAIL: string;
    DEFAULT_ADMIN_PASSWORD: string;
    ENVIRONMENT: string;
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

export type ConfigurationValueType = 'string' | 'number' | 'boolean' | 'path';

export interface ConfigurationValueData {
    type: ConfigurationValueType;
    required: boolean;
    filter?: any[];
}

export type ConfigurationSchema<ConfigurationDataType> = (
    Record<keyof ConfigurationDataType, ConfigurationValueData>
);

export const configurationSchema: ConfigurationSchema<Configuration> = {
    DEFAULT_ADMIN_NAME: {
        type: 'string',
        required: true
    },
    DEFAULT_ADMIN_EMAIL: {
        type: 'string',
        required: true
    },
    DEFAULT_ADMIN_PASSWORD: {
        type: 'string',
        required: true
    },
    ENVIRONMENT: {
        type: 'string',
        required: true,
        filter: ['dev', 'prod']
    },
    PORT: {
        type: 'number',
        required: true
    },
    JWT_SECRET: {
        type: 'string',
        required: true
    },
    COOKIE_SECRET: {
        type: 'string',
        required: true
    },
    COOKIE_SECURE: {
        type: 'boolean',
        required: true
    },
    LOG_ENABLED: {
        type: 'boolean',
        required: true
    },
    LOG_DIR: {
        type: 'string',
        required: false
    },
    CHECKPOINT_DISABLE: {
        type: 'boolean',
        required: false
    },
    MONGO_URL: {
        type: 'string',
        required: true
    },
    ASSET_DIR: {
        type: 'string',
        required: true
    }
};
