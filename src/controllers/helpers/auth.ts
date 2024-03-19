import { FastifyRequest } from 'fastify';
import { CookieSerializeOptions } from '@fastify/cookie';
import dayjs from 'dayjs';

import { AuthenticationError, ForbiddenError } from '../../services/errors.js';
import { decrypt, verifyJwt } from '../../services/crypto.js';
import { parseParamId } from '../../services/api.js';
import { cacheDelete, cacheGet, cacheSet } from '../../services/cache.js';
import { getEnv } from '../../services/env.js';
import { SafeUser } from '../../types/user.js';

/**
Returns options object for cookies
*/
export const getCookieOptions = (): CookieSerializeOptions => ({
    httpOnly: true,
    signed: true,
    secure: getEnv('COOKIE_SECURE'),
    sameSite: true,
    expires: dayjs().add(12, 'hours').toDate(),
    path: '/'
});

interface CacheJwtData {
    jwt: string;
    user: SafeUser;
}

/**
Build the cache key for JWT data
*/
export const buildCacheJwtKey = (user: SafeUser) => `jwt-${user.id}`;

/**
Stores JWT in cache so it can be verified later.
Set expiration time to the JWT duration.
*/
export const storeCacheJwt = (user: SafeUser, jwt: string) =>
    cacheSet<CacheJwtData>(buildCacheJwtKey(user), {
        jwt,
        user
    });

/**
Verifies that the given JWT is well registered in cache
*/
export const verifyCacheJwt = (user: SafeUser, jwt: string): SafeUser => {
    const jwtData = cacheGet<CacheJwtData>(buildCacheJwtKey(user));
    if (jwtData && jwtData.jwt === jwt) {
        return jwtData.user;
    }
    throw new AuthenticationError('JWT is not valid');
};

/**
Revokes a user JWT by deleting it from cache
*/
export const deleteCacheJwt = (user: SafeUser) =>
    cacheDelete(buildCacheJwtKey(user));

/**
Updates JWT user data in cache
*/
export const updateCacheJwtUser = (user: SafeUser) => {
    cacheSet<CacheJwtData>(buildCacheJwtKey(user), (prev) => ({
        ...prev,
        user
    }));
};

/**
Control that the given userId is the same as the currently authenticated user's id.
*/
export const controlSelf = (userId: number, currentUser: SafeUser) => {
    if (userId !== currentUser.id) {
        throw new ForbiddenError();
    }
};

/**
Middleware controlling that the given userId is the same as the currently authenticated user's id.
*/
export const controlSelfMiddleware = async ({
    params,
    user
}: FastifyRequest<{
    Params: { userId: string };
}>) => {
    const userId = parseParamId(params, 'userId');
    controlSelf(userId, user);
};

/**
Check that the given user is an admin
*/
export const controlAdmin = (user: SafeUser) => {
    if (!user.isAdmin) {
        throw new ForbiddenError();
    }
};

/**
Middleware checking that the currently authenticated user is an admin
*/
export const controlAdminMiddleware = async ({ user }: FastifyRequest) => {
    controlAdmin(user);
};

/**
Fastify middleware controling the cookie JWT validity.
Injects user data in Fastify Request object
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
    const jwtData = verifyJwt(jwt);
    const user = verifyCacheJwt(jwtData, jwt);
    req.user = user;
};
