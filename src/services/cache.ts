import { NotFoundError } from './errors';

type CacheHandler = (previous: any) => any;
type CacheSaver = (data: any) => any;

const cache: Record<string, any> = {};
const timeouts: Record<string, ReturnType<typeof setTimeout>> = {};

export const cacheGet = (
    key: string,
    throwNotFound: boolean = false
): any => {
    if (Object.hasOwn(cache, key)) {
        return cache[key];
    }
    if (throwNotFound) {
        throw new NotFoundError(`Could not get Id ${key} from cache`);
    }
    return null;
};

export const cacheSet = (
    key: string,
    handler: CacheHandler
): any => {
    cache[key] = handler(cache[key]);
    return cache[key];
};

export const cacheSave = (
    key: string,
    saver: CacheSaver,
    timer: number = 0
) => {
    const data = cacheGet(key);
    if (data) {
        if (timeouts[key]) {
            clearTimeout(timeouts[key]);
        }
        timeouts[key] = setTimeout(async () => {
            await saver(data);
        }, timer);
    }
};
