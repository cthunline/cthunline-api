import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { getCookieOptions } from './helpers/auth';

import { verifyPassword, generateJwt, encrypt } from '../services/crypto';
import { registerRateLimiter } from '../services/rateLimiter';
import { AuthenticationError } from '../services/errors';
import { Prisma } from '../services/prisma';
import { getEnv } from '../services/env';

import { loginSchema, LoginBody } from './schemas/auth';

const authController = async (app: FastifyInstance) => {
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
                const userWithPassword = await Prisma.user.findFirst({
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

export default authController;
