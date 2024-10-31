import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { hashPassword } from '../services/crypto.js';
import { getEnv } from '../services/env.js';
import { ForbiddenError } from '../services/errors.js';
import { createInvitation } from '../services/queries/invitation.js';
import { createUser } from '../services/queries/user.js';
import { registerRateLimiter } from '../services/rateLimiter.js';
import {
    controlInvitationCode,
    generateInvitationCode
} from './helpers/registration.js';
import { controlUniqueEmail, defaultUserData } from './helpers/user.js';
import { registerUserSchema } from './schemas/user.js';

export const registrationController: FastifyPluginAsyncTypebox = async (
    app
) => {
    const rlSubController: FastifyPluginAsyncTypebox = async (routeApp) => {
        // rate limiter
        await registerRateLimiter(routeApp);
        // register a new user
        routeApp.route({
            method: 'POST',
            url: '/register',
            schema: { body: registerUserSchema },
            handler: async ({ body }, rep) => {
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
    };

    await app.register(rlSubController);

    // generate a new invitation
    app.route({
        method: 'POST',
        url: '/invitation',
        handler: async (_req, rep) => {
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
