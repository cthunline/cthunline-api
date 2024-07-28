import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { getInstanceStats } from './helpers/stat.js';

export const statController = async (app: FastifyInstance) => {
    // biome-ignore lint/suspicious/useAwait: fastify controllers require async

    // get statistics about the instance
    app.route({
        method: 'GET',
        url: '/stats',
        handler: async (
            {
                user
            }: FastifyRequest<{
                Params: {
                    sessionId: string;
                };
            }>,
            rep: FastifyReply
        ) => {
            const stats = await getInstanceStats(app, user.id);
            rep.send(stats);
        }
    });
};
