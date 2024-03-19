import { NotFoundError } from './errors.js';

const cacheMap: Map<string, any> = new Map();
const timeouts: Record<string, ReturnType<typeof setTimeout>> = {};

interface CacheGetOptions {
    throwNotFound?: boolean;
}

export const cacheGet = <T = any>(
    key: string,
    options?: CacheGetOptions
): T | undefined => {
    const val = cacheMap.get(key);
    if (val) {
        return val as T;
    }
    if (options?.throwNotFound) {
        throw new NotFoundError(`Could not get Id ${key} from cache`);
    }
    return undefined;
};

type CacheSetHandler<T> = (prev: T) => T;
type CachetSetValueOrHandler<T> = T | CacheSetHandler<T>;

const isHandler = <T>(
    valueOrHandler: CachetSetValueOrHandler<T>
): valueOrHandler is CacheSetHandler<T> => typeof valueOrHandler === 'function';

export const cacheSet = <T = any>(
    key: string,
    valueOrHandler: CachetSetValueOrHandler<T>
): T => {
    if (isHandler<T>(valueOrHandler)) {
        const prev = cacheMap.get(key);
        if (prev) {
            cacheMap.set(key, valueOrHandler(prev));
        }
    } else {
        cacheMap.set(key, valueOrHandler);
    }
    return cacheMap.get(key);
};

type CacheSaver<T> = (data: T) => void | Promise<void>;

export const cacheSave = <T = any>(
    key: string,
    saver: CacheSaver<T>,
    timerMs: number = 0
) => {
    const data = cacheGet<T>(key);
    if (data) {
        if (timeouts[key]) {
            clearTimeout(timeouts[key]);
        }
        timeouts[key] = setTimeout(() => {
            saver(data);
        }, timerMs);
    }
};

export const cacheDelete = (key: string): boolean => cacheMap.delete(key);
