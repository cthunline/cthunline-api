import {
    Router,
    Request,
    Response
} from 'express';

import { NotFoundError } from '../services/errors';
import { GamesData, isValidGameId } from '../games';

const gameRouter = Router();

// get all games
gameRouter.get('/games', async (req: Request, res: Response): Promise<void> => {
    try {
        const games = Object.values(GamesData);
        res.json({
            games
        });
    } catch (err: any) {
        res.error(err);
    }
});

// get a game
gameRouter.get('/games/:gameId', async ({ params }: Request, res: Response): Promise<void> => {
    try {
        const { gameId } = params;
        if (!isValidGameId(gameId)) {
            throw new NotFoundError('Game not found');
        }
        res.json(GamesData[gameId]);
    } catch (err: any) {
        res.error(err);
    }
});

export default gameRouter;
