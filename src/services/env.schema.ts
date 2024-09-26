import { Type } from '@sinclair/typebox';
import ajvFormats from 'ajv-formats';

export const envSchema = Type.Object({
    // app
    DEFAULT_ADMIN_NAME: Type.String({ minLength: 1 }),
    DEFAULT_ADMIN_EMAIL: Type.RegExp(ajvFormats.get('email') as RegExp),
    DEFAULT_ADMIN_PASSWORD: Type.String({ minLength: 1 }),
    REGISTRATION_ENABLED: Type.Boolean(),
    INVITATION_ENABLED: Type.Optional(Type.Boolean()),
    DEFAULT_THEME: Type.Union([Type.Literal('dark'), Type.Literal('light')]),
    DEFAULT_LOCALE: Type.Union([Type.Literal('fr'), Type.Literal('en')]),
    // server
    ENVIRONMENT: Type.Union([Type.Literal('dev'), Type.Literal('prod')]),
    HOST: Type.RegExp(ajvFormats.get('ipv4') as RegExp),
    PORT: Type.Integer({ minimum: 1 }),
    JWT_SECRET: Type.String({ minLength: 32, maxLength: 32 }),
    CRYPTO_SECRET: Type.String({ minLength: 32, maxLength: 32 }),
    COOKIE_SECRET: Type.String({ minLength: 32, maxLength: 32 }),
    COOKIE_DURATION: Type.TemplateLiteral('${number}${w|d|h|m|s|ms}'),
    COOKIE_SECURE: Type.Boolean(),
    LOG_LEVEL: Type.Union([
        Type.Literal('debug'),
        Type.Literal('info'),
        Type.Literal('warn'),
        Type.Literal('error')
    ]),
    LOG_DIR: Type.Optional(Type.String({ minLength: 1 })),
    REVERSE_PROXY: Type.Boolean(),
    RL_WINDOW_DURATION: Type.Integer({ minimum: 1 }),
    RL_MAX_REQUESTS: Type.Integer({ minimum: 1 }),
    // database
    DATABASE_URL: Type.String({ minLength: 1 }),
    // cache
    CACHE_HOST: Type.String({ minLength: 1 }),
    CACHE_PORT: Type.Integer({ minimum: 1 }),
    CACHE_DATABASE: Type.Integer({ minimum: 0 }),
    CACHE_PASSWORD: Type.Optional(Type.String({ minLength: 1 })),
    CACHE_SKETCH_SAVE_MS: Type.Optional(Type.Integer({ minimum: 0 })),
    // assets
    ASSET_DIR: Type.String({ minLength: 1 }),
    ASSET_MAX_SIZE_MB: Type.Integer({ minimum: 1 }),
    ASSET_MAX_SIZE_MB_PER_FILE: Type.Integer({ minimum: 1 }),
    PORTRAIT_MAX_SIZE_MB: Type.Integer({ minimum: 1 })
});
