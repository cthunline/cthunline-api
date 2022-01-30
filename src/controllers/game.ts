import {
    Router,
    Request,
    Response
} from 'express';
import { Game } from '@prisma/client';
import {
    Prisma,
    handleNotFound
} from '../services/prisma';
import Validator from '../services/validator';
import GameSchemas from './schemas/game.json';

const validateCreate = Validator(GameSchemas.create);
const validateUpdate = Validator(GameSchemas.update);

const gameRouter = Router();

gameRouter.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const games = await Prisma.game.findMany();
        res.json({ games });
    } catch (err: any) {
        res.error(err);
    }
});

gameRouter.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        validateCreate(req.body);
        const game = await Prisma.game.create({
            data: {
                ...req.body,
                masterId: req.token.userId
            }
        });
        res.json(game);
    } catch (err: any) {
        res.error(err);
    }
});

gameRouter.get('/:gameId', async ({ params }: Request, res: Response): Promise<void> => {
    try {
        const { gameId } = params;
        const game = await handleNotFound<Game>(
            'Game', (
                Prisma.game.findUnique({
                    where: {
                        id: gameId
                    }
                })
            )
        );
        res.json(game);
    } catch (err: any) {
        res.error(err);
    }
});

gameRouter.post('/:gameId', async ({ params, body }: Request, res: Response): Promise<void> => {
    try {
        const { gameId } = params;
        const game = await handleNotFound<Game>(
            'Game', (
                Prisma.game.findUnique({
                    where: {
                        id: gameId
                    }
                })
            )
        );
        validateUpdate(body);
        const updatedGame = await Prisma.game.update({
            data: body,
            where: {
                id: game.id
            }
        });
        res.json(updatedGame);
    } catch (err: any) {
        res.error(err);
    }
});

export default gameRouter;
