import {
    type FastifyInstance,
    type FastifyReply,
    type FastifyRequest
} from 'fastify';

import { registerUserSchema, type RegisterUserBody } from './schemas/user.js';
import { controlUniqueEmail, defaultUserData } from './helpers/user.js';
import { createInvitation } from '../services/queries/invitation.js';
import { registerRateLimiter } from '../services/rateLimiter.js';
import { createUser } from '../services/queries/user.js';
import { ForbiddenError } from '../services/errors.js';
import { hashPassword } from '../services/crypto.js';
import { getEnv } from '../services/env.js';
import {
    controlInvitationCode,
    generateInvitationCode
} from './helpers/registration.js';

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
                const createdUser = await createUser({
                    ...defaultUserData,
                    ...cleanBody,
                    password: hashedPassword
                });
                rep.send(createdUser);
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
            const { code } = await createInvitation(generateInvitationCode());
            rep.send({ code });
        }
    });
};
