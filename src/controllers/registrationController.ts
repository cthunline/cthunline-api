import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { registerRateLimiter } from '../services/rateLimiter.js';
import { ForbiddenError } from '../services/errors.js';
import { hashPassword } from '../services/crypto.js';
import { prisma } from '../services/prisma.js';
import { getEnv } from '../services/env.js';

import {
    controlInvitationCode,
    generateInvitationCode
} from './helpers/registration.js';
import {
    safeUserSelect,
    controlUniqueEmail,
    defaultUserData
} from './helpers/user.js';

import { registerUserSchema, RegisterUserBody } from './schemas/user.js';

export const registrationController = async (app: FastifyInstance) => {
    await app.register(async (routeApp: FastifyInstance) => {
        // rate limiter
        await registerRateLimiter(routeApp);
        // register a new user
        app.route({
            method: 'POST',
            url: '/register',
            schema: { body: registerUserSchema },
            handler: async (
                {
                    body
                }: FastifyRequest<{
                    Body: RegisterUserBody;
                }>,
                rep: FastifyReply
            ) => {
                if (!getEnv('REGISTRATION_ENABLED')) {
                    throw new ForbiddenError('Registration is disabled');
                }
                if (getEnv('INVITATION_ENABLED')) {
                    await controlInvitationCode(
                        body.invitationCode ?? '',
                        true
                    );
                }
                await controlUniqueEmail(body.email);
                const hashedPassword = await hashPassword(body.password);
                const { password, invitationCode, ...cleanBody } = body;
                const user = await prisma.user.create({
                    select: safeUserSelect,
                    data: {
                        ...defaultUserData,
                        ...cleanBody,
                        password: hashedPassword
                    }
                });
                rep.send(user);
            }
        });
    });

    // generate a new invitation
    app.route({
        method: 'POST',
        url: '/invitation',
        handler: async (
            req: FastifyRequest<{
                Body: RegisterUserBody;
            }>,
            rep: FastifyReply
        ) => {
            if (!getEnv('REGISTRATION_ENABLED')) {
                throw new ForbiddenError('Registration is disabled');
            }
            if (!getEnv('INVITATION_ENABLED')) {
                throw new ForbiddenError('Invitation codes are disabled');
            }
            const { code } = await prisma.invitation.create({
                data: generateInvitationCode()
            });
            rep.send({ code });
        }
    });
};
