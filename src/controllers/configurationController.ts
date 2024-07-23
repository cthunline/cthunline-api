import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { getEnv } from '../services/env.js';

export const configurationController = async (app: FastifyInstance) => {
    // public configuration
    app.route({
        method: 'GET',
        url: '/configuration',
        handler: async (_req: FastifyRequest, rep: FastifyReply) => {
            // biome-ignore lint/suspicious/useAwait: fastify handler require async
            rep.send({
                registrationEnabled: getEnv('REGISTRATION_ENABLED'),
                invitationEnabled: getEnv('INVITATION_ENABLED'),
                defaultTheme: getEnv('DEFAULT_THEME'),
                defaultLocale: getEnv('DEFAULT_LOCALE'),
                apiVersion: process.env.npm_package_version
            });
        }
    });
};
