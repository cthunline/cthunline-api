import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { registerUserSchema, type RegisterUserBody } from './schemas/user.js';
import { ForbiddenError, InternError } from '../services/errors.js';
import { registerRateLimiter } from '../services/rateLimiter.js';
import { hashPassword } from '../services/crypto.js';
import { db, tables } from '../services/db.js';
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
                const createdUsers = await db
                    .insert(tables.users)
                    .values({
                        ...defaultUserData,
                        ...cleanBody,
                        password: hashedPassword
                    })
                    .returning(safeUserSelect);
                const user = createdUsers[0];
                if (!user) {
                    throw new InternError('Could not retreive inserted user');
                }
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
            const createdInvitations = await db
                .insert(tables.invitations)
                .values(generateInvitationCode())
                .returning();
            const invitation = createdInvitations[0];
            if (!invitation) {
                throw new InternError('Could not retreive inserted invitation');
            }
            rep.send({ code: invitation.code });
        }
    });
};
