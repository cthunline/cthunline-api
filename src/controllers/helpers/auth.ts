import { FastifyRequest } from 'fastify';
import { CookieSerializeOptions } from '@fastify/cookie';
import DaysJs from 'dayjs';

import { AuthenticationError, ForbiddenError } from '../../services/errors';
import { decrypt, verifyJwt } from '../../services/crypto';
import { parseParamId } from '../../services/api';
import { getEnv } from '../../services/env';
import { SafeUser } from '../../types/user';

/**
Returns options object for cookies
*/
export const getCookieOptions = (): CookieSerializeOptions => ({
    httpOnly: true,
    signed: true,
    secure: getEnv('COOKIE_SECURE'),
    sameSite: true,
    expires: DaysJs().add(12, 'hours').toDate(),
    path: '/'
});

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
    req.user = jwtData;
};
