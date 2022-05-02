export const locales = [
    'fr',
    'en'
];

export interface Configuration {
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
    CHECKPOINT_DISABLE: boolean;
    DATABASE_URL: string;
    ASSET_DIR: string;
    ASSET_MAX_SIZE_MB: number;
    ASSET_MAX_SIZE_MB_PER_FILE: number;
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
    REGISTRATION_ENABLED: {
        type: 'boolean',
        required: true
    },
    INVITATION_ENABLED: {
        type: 'boolean',
        required: false
    },
    DEFAULT_THEME: {
        type: 'string',
        required: true,
        filter: ['dark', 'light']
    },
    DEFAULT_LOCALE: {
        type: 'string',
        required: true,
        filter: locales
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
    REVERSE_PROXY: {
        type: 'boolean',
        required: true
    },
    RL_WINDOW_DURATION: {
        type: 'number',
        required: true
    },
    RL_MAX_REQUESTS: {
        type: 'number',
        required: true
    },
    CHECKPOINT_DISABLE: {
        type: 'boolean',
        required: false
    },
    DATABASE_URL: {
        type: 'string',
        required: true
    },
    ASSET_DIR: {
        type: 'string',
        required: true
    },
    ASSET_MAX_SIZE_MB: {
        type: 'number',
        required: true
    },
    ASSET_MAX_SIZE_MB_PER_FILE: {
        type: 'number',
        required: true
    }
};
