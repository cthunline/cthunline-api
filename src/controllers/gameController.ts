import {
    type FastifyInstance,
    type FastifyRequest,
    type FastifyReply
} from 'fastify';

import { gamesData, isValidGameId } from '../services/games.js';
import { NotFoundError } from '../services/errors.js';

export const gameController = async (app: FastifyInstance) => {
    // get all games
    app.route({
        method: 'GET',
        url: '/games',
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const games = Object.values(gamesData);
            rep.send({ games });
        }
    });

    // get a game
    app.route({
        method: 'GET',
        url: '/games/:gameId',
        handler: async (
            {
                params
            }: FastifyRequest<{
                Params: {
                    gameId: string;
                };
            }>,
            rep: FastifyReply
        ) => {
            const { gameId } = params;
            if (!isValidGameId(gameId)) {
                throw new NotFoundError('Game not found');
            }
            rep.send(gamesData[gameId]);
        }
    });
};
