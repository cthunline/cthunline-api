import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { NotFoundError } from '../services/errors.js';
import { gamesData, isValidGameId } from '../services/games.js';
import { gameIdParamSchema } from './schemas/params.js';

export const gameController: FastifyPluginAsyncTypebox = async (app) => {
    // get all games
    app.route({
        method: 'GET',
        url: '/games',
        handler: async (_req, rep) => {
            // biome-ignore lint/suspicious/useAwait: fastify handler require async
            const games = Object.values(gamesData);
            rep.send({ games });
        }
    });

    // get a game
    app.route({
        method: 'GET',
        url: '/games/:gameId',
        schema: {
            params: gameIdParamSchema
        },
        handler: async ({ params: { gameId } }, rep) => {
            // biome-ignore lint/suspicious/useAwait: fastify handler require async
            if (!isValidGameId(gameId)) {
                throw new NotFoundError('Game not found');
            }
            rep.send(gamesData[gameId]);
        }
    });
};
