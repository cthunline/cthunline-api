import {
    type FastifyInstance,
    type FastifyRequest,
    type FastifyReply
} from 'fastify';

import { getEnv } from '../services/env.js';

export const configurationController = async (app: FastifyInstance) => {
    // public configuration
    app.route({
        method: 'GET',
        url: '/configuration',
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            rep.send({
                registrationEnabled: getEnv('REGISTRATION_ENABLED'),
                invitationEnabled: getEnv('INVITATION_ENABLED'),
                defaultTheme: getEnv('DEFAULT_THEME'),
                defaultLocale: getEnv('DEFAULT_LOCALE')
            });
        }
    });
};
