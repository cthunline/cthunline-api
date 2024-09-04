import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { cache } from '../services/cache.js';
import { encrypt, generateJwt, verifyPassword } from '../services/crypto.js';
import { getEnv } from '../services/env.js';
import { AuthenticationError } from '../services/errors.js';
import { getUnsafeUserByEmail } from '../services/queries/user.js';
import { registerRateLimiter } from '../services/rateLimiter.js';
import {
    type CacheJwtData,
    getCookieOptions,
    getJwtCacheKey
} from './helpers/auth.js';
import { type LoginBody, loginSchema } from './schemas/auth.js';

export const authController = async (app: FastifyInstance) => {
    // check authentication validity
    app.route({
        method: 'GET',
        url: '/auth',
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            // biome-ignore lint/suspicious/useAwait: fastify handler require async
            rep.send(req.user);
        }
    });

    await app.register(async (routeApp: FastifyInstance) => {
        // rate limiter
        await registerRateLimiter(routeApp);
        // login using an email, if the email is valid sends a magic link to the user by email
        routeApp.route({
            method: 'POST',
            url: '/auth',
            schema: { body: loginSchema },
            handler: async (
                req: FastifyRequest<{
                    Body: LoginBody;
                }>,
                rep: FastifyReply
            ) => {
                const { email, password } = req.body;
                const unsafeUser = await getUnsafeUserByEmail(email);
                if (!unsafeUser || !unsafeUser.isEnabled) {
                    throw new AuthenticationError();
                }
                const { password: hash, ...user } = unsafeUser;
                const verified = await verifyPassword(password, hash);
                if (!verified) {
                    throw new AuthenticationError();
                }
                const jwt = generateJwt(user);
                const cacheKey = getJwtCacheKey(user.id);
                await cache.del(cacheKey);
                await cache.setJson<CacheJwtData>(cacheKey, {
                    jwt,
                    user
                });
                const encryptedJwt = encrypt(jwt, getEnv('CRYPTO_SECRET'));
                rep.cookie('jwt', encryptedJwt, getCookieOptions()).send(user);
            }
        });
    });

    // logout
    app.route({
        method: 'DELETE',
        url: '/auth',
        handler: async ({ user }: FastifyRequest, rep: FastifyReply) => {
            const cacheKey = getJwtCacheKey(user.id);
            await cache.del(cacheKey);
            // delete jwt cookie on client
            rep.clearCookie('jwt').send({});
        }
    });
};
