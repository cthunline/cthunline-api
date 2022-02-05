import {
    Router,
    Request,
    Response
} from 'express';
import {
    User,
    Character
} from '@prisma/client';
import {
    Prisma,
    handleNotFound
} from '../services/prisma';
import Validator from '../services/validator';
import { NotFoundError } from '../services/errors';
import CharacterSchemas from './schemas/character.json';
import Games from '../games/games.json';
import CoCCharacterSheet from '../games/callOfCthulhu';

const validateCreate = Validator(CharacterSchemas.create);
const validateUpdate = Validator(CharacterSchemas.update);

const controlUser = async (userId: string) => (
    handleNotFound<User>(
        'User', (
            Prisma.user.findUnique({
                where: {
                    id: userId
                }
            })
        )
    )
);

const controlGame = (gameId: string) => {
    if (!Object.keys(Games).includes(gameId)) {
        throw new NotFoundError('Game not found');
    }
};

// TODO
// TODO
// TODO
// rendre CoCCharacterSheet générique?
// utiliser les type génériques selon le jeu?
// sinon supporter des jeux différents car actuellement ne supporte que cthulhu
// TODO
// TODO
// TODO

const characterRouter = Router();

characterRouter.get('/characters', async (req: Request, res: Response): Promise<void> => {
    try {
        const characters = await Prisma.character.findMany();
        res.json({ characters });
    } catch (err: any) {
        res.error(err);
    }
});

characterRouter.get('/users/:userId/characters', async ({ params }: Request, res: Response): Promise<void> => {
    try {
        const { userId } = params;
        await controlUser(userId);
        const characters = await Prisma.character.findMany({
            where: {
                userId
            }
        });
        res.json({ characters });
    } catch (err: any) {
        res.error(err);
    }
});

characterRouter.post('/users/:userId/characters', async ({ body, params }: Request, res: Response): Promise<void> => {
    try {
        validateCreate(body);
        const { userId } = params;
        await controlUser(userId);
        const { gameId, data } = body;
        controlGame(gameId);
        const characterInstance = new CoCCharacterSheet(data, userId);
        const character = await characterInstance.save();
        res.json(character);
    } catch (err: any) {
        res.error(err);
    }
});

characterRouter.get('/users/:userId/characters/:characterId', async ({ params }: Request, res: Response): Promise<void> => {
    try {
        const { userId, characterId } = params;
        await controlUser(userId);
        const character = await handleNotFound<Character>(
            'Character', (
                Prisma.character.findUnique({
                    where: {
                        id: characterId
                    }
                })
            )
        );
        res.json(character);
    } catch (err: any) {
        res.error(err);
    }
});

characterRouter.post('/users/:userId/characters/:characterId', async ({ params, body }: Request, res: Response): Promise<void> => {
    try {
        const { userId, characterId } = params;
        await controlUser(userId);
        validateUpdate(body);
        const { data } = body;
        const characterInstance = new CoCCharacterSheet(data, userId, characterId);
        const character = await characterInstance.save();
        res.json(character);
    } catch (err: any) {
        res.error(err);
    }
});

characterRouter.delete('/users/:userId/characters/:characterId', async ({ params }: Request, res: Response): Promise<void> => {
    try {
        const { userId, characterId } = params;
        await controlUser(userId);
        await handleNotFound<Character>(
            'Character', (
                Prisma.character.findUnique({
                    where: {
                        id: characterId
                    }
                })
            )
        );
        await Prisma.character.delete({
            where: {
                id: characterId
            }
        });
        res.send({});
    } catch (err: any) {
        res.error(err);
    }
});

export default characterRouter;
