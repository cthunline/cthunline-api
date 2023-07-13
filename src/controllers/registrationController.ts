import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { registerRateLimiter } from '../services/rateLimiter';
import { ForbiddenError } from '../services/errors';
import { hashPassword } from '../services/crypto';
import { Prisma } from '../services/prisma';
import { getEnv } from '../services/env';

import {
    controlInvitationCode,
    generateInvitationCode
} from './helpers/registration';
import {
    safeUserSelect,
    controlUniqueEmail,
    defaultUserData
} from './helpers/user';

import { registerUserSchema, RegisterUserBody } from './schemas/user';

const registrationController = async (app: FastifyInstance) => {
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
                const user = await Prisma.user.create({
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
            const { code } = await Prisma.invitation.create({
                data: generateInvitationCode()
            });
            rep.send({ code });
        }
    });
};

export default registrationController;
