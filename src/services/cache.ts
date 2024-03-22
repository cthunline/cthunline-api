import { Redis as IoRedis, type RedisOptions as IoRedisOptions } from 'ioredis';

import { InternError } from './errors.js';
import { getEnv } from './env.js';

interface CacheSetJsonOptions {
    /** Expiration time in seconds */
    expire?: number;
}

class CacheClient extends IoRedis {
    async getJson<T = any>(key: string): Promise<T | null> {
        try {
            const jsonString = await this.get(key);
            if (jsonString) {
                return JSON.parse(jsonString);
            }
            return null;
        } catch {
            return null;
        }
    }

    async setJson<T = any>(
        key: string,
        data: T,
        options?: CacheSetJsonOptions
    ): Promise<boolean> {
        try {
            if (options?.expire) {
                await this.set(key, JSON.stringify(data), 'EX', options.expire);
            } else {
                await this.set(key, JSON.stringify(data));
            }
            return true;
        } catch {
            return false;
        }
    }
}

const createCacheClient = async (
    options?: IoRedisOptions
): Promise<CacheClient> =>
    new Promise((resolve, reject) => {
        const client = new CacheClient({
            host: getEnv('CACHE_HOST'),
            port: getEnv('CACHE_PORT'),
            db: getEnv('CACHE_DATABASE'),
            password: getEnv('CACHE_PASSWORD'),
            ...options
        });
        client.on('ready', () => {
            resolve(client);
        });
        client.on('error', (err) => {
            reject(
                new InternError(
                    `Error while connecting to the cache server (KeyDB or Redis) : ${err.message}`
                )
            );
        });
    });

export const cache = await createCacheClient();
