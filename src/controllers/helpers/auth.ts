import type { CookieSerializeOptions } from '@fastify/cookie';
import dayjs from 'dayjs';
import type {
    FastifyRequest,
    onRequestAsyncHookHandler as OnRequestAsyncHookHandler
} from 'fastify';
import ms from 'ms';

import type { SafeUser } from '../../drizzle/schema.js';
import { cache } from '../../services/cache.js';
import { decrypt, verifyJwt } from '../../services/crypto.js';
import { getEnv } from '../../services/env.js';
import { AuthenticationError, ForbiddenError } from '../../services/errors.js';

/**
Returns options object for cookies.
*/
export const getCookieOptions = (): CookieSerializeOptions => ({
    httpOnly: true,
    signed: true,
    secure: getEnv('COOKIE_SECURE'),
    sameSite: true,
    expires: dayjs()
        .add(ms(getEnv('COOKIE_DURATION')), 'ms')
        .toDate(),
    path: '/'
});

export interface CacheJwtData {
    jwt: string;
    user: SafeUser;
}

/**
Builds the cache key for JWT data.
*/
export const getJwtCacheKey = (userId: number) => `jwt-${userId}`;

/**
Checks that the given userId is the same as the currently authenticated user's id.
*/
export const controlSelf = (userId: number, currentUser: SafeUser) => {
    if (userId !== currentUser.id) {
        throw new ForbiddenError();
    }
};

/**
Checks that the given user is an admin.
*/
export const controlAdmin = (user: SafeUser) => {
    if (!user.isAdmin) {
        throw new ForbiddenError();
    }
};

/**
Middleware checking that the currently authenticated user is an admin.
*/
export const controlAdminMiddleware: OnRequestAsyncHookHandler = async ({
    user
}) => {
    // biome-ignore lint/suspicious/useAwait: fastify middlewares require async
    controlAdmin(user);
};

/**
Fastify middleware controling the cookie JWT validity.
Injects user data in Fastify Request object.
*/
export const authMiddleware = async (req: FastifyRequest) => {
    if (!req.cookies.jwt) {
        throw new AuthenticationError('Missing authentication cookie');
    }
    const encryptedJwt = req.unsignCookie(req.cookies.jwt);
    if (!encryptedJwt.valid) {
        throw new AuthenticationError('Failed to unsign authentication cookie');
    }
    if (!encryptedJwt.value) {
        throw new AuthenticationError('Invalid authentication cookie value');
    }
    const jwt = decrypt(
        encryptedJwt.value,
        getEnv('CRYPTO_SECRET'),
        AuthenticationError
    );
    const jwtUser = verifyJwt(jwt);
    const cacheJwtData = await cache.getJson<CacheJwtData>(
        getJwtCacheKey(jwtUser.id)
    );
    if (!cacheJwtData || cacheJwtData.jwt !== jwt) {
        throw new AuthenticationError('JWT is not valid');
    }
    req.user = cacheJwtData.user;
};
