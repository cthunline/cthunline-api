import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { getCookieOptions } from './helpers/auth.js';

import { verifyPassword, generateJwt, encrypt } from '../services/crypto.js';
import { registerRateLimiter } from '../services/rateLimiter.js';
import { AuthenticationError } from '../services/errors.js';
import { prisma } from '../services/prisma.js';
import { getEnv } from '../services/env.js';

import { loginSchema, LoginBody } from './schemas/auth.js';

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
                const userWithPassword = await prisma.user.findFirst({
                    where: {
                        email,
                        isEnabled: true
                    }
                });
                if (!userWithPassword) {
                    throw new AuthenticationError();
                }
                const { password: hash, ...user } = userWithPassword;
                const verified = await verifyPassword(password, hash);
                if (!verified) {
                    throw new AuthenticationError();
                }
                const jwt = generateJwt(user);
                const encryptedJwt = encrypt(jwt, getEnv('CRYPTO_SECRET'));
                rep.cookie('jwt', encryptedJwt, getCookieOptions()).send(user);
            }
        });
    });

    // logout
    app.route({
        method: 'DELETE',
        url: '/auth',
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            // delete jwt cookie on client
            rep.clearCookie('jwt').send({});
        }
    });
};
