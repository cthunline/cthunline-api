import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { getEnv } from '../services/env.js';

const configurationController = async (app: FastifyInstance) => {
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

export default configurationController;
