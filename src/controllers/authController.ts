import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { and, eq } from 'drizzle-orm';

import { verifyPassword, generateJwt, encrypt } from '../services/crypto.js';
import { registerRateLimiter } from '../services/rateLimiter.js';
import { AuthenticationError } from '../services/errors.js';
import { loginSchema, LoginBody } from './schemas/auth.js';
import { db, tables } from '../services/db.js';
import { cache } from '../services/cache.js';
import { getEnv } from '../services/env.js';
import {
    type CacheJwtData,
    getJwtCacheKey,
    getCookieOptions
} from './helpers/auth.js';

export const authController = async (app: FastifyInstance) => {
    // check authentication validity
    app.route({
        method: 'GET',
        url: '/auth',
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            rep.send(req.user);
        }
    });

    await app.register(async (routeApp: FastifyInstance) => {
        // rate limiter
        await registerRateLimiter(routeApp);
        // login using an email, if the email is valid sends a magic link to the user by email
        app.route({
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
                const usersWithPassword = await db
                    .select()
                    .from(tables.users)
                    .where(
                        and(
                            eq(tables.users.email, email),
                            eq(tables.users.isEnabled, true)
                        )
                    )
                    .limit(1);
                const userWithPassword = usersWithPassword[0];
                if (!userWithPassword) {
                    throw new AuthenticationError();
                }
                const { password: hash, ...user } = userWithPassword;
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
