import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { getInstanceStats } from './helpers/stats.js';

export const statsController: FastifyPluginAsyncTypebox = async (app) => {
    // biome-ignore lint/suspicious/useAwait: fastify controllers require async

    // get statistics about the instance
    app.route({
        method: 'GET',
        url: '/statistics',
        handler: async ({ user }, rep) => {
            const stats = await getInstanceStats(app, user.id);
            return rep.send(stats);
        }
    });
};
