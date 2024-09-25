import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { NotFoundError } from '../services/errors.js';
import { gamesData, isValidGameId } from '../services/games.js';
import { type GameIdParams, gameIdSchema } from './schemas/params.js';

export const gameController = async (app: FastifyInstance) => {
    // get all games
    app.route({
        method: 'GET',
        url: '/games',
        handler: async (_req: FastifyRequest, rep: FastifyReply) => {
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
            params: gameIdSchema
        },
        handler: async (
            {
                params: { gameId }
            }: FastifyRequest<{
                Params: GameIdParams;
            }>,
            rep: FastifyReply
        ) => {
            // biome-ignore lint/suspicious/useAwait: fastify handler require async
            if (!isValidGameId(gameId)) {
                throw new NotFoundError('Game not found');
            }
            rep.send(gamesData[gameId]);
        }
    });
};
