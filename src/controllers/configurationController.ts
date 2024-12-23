import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { getEnv } from '../services/env.js';

export const configurationController: FastifyPluginAsyncTypebox = async (
    app
) => {
    // public configuration
    app.route({
        method: 'GET',
        url: '/configuration',
        handler: async (_req, rep) => {
            // biome-ignore lint/suspicious/useAwait: fastify handler require async
            return rep.send({
                registrationEnabled: getEnv('REGISTRATION_ENABLED'),
                invitationEnabled: getEnv('INVITATION_ENABLED'),
                defaultTheme: getEnv('DEFAULT_THEME'),
                defaultLocale: getEnv('DEFAULT_LOCALE'),
                apiVersion: process.env.npm_package_version
            });
        }
    });
};
