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
import { ValidationError } from '../services/errors';
import CharacterSchemas from './schemas/character.json';
import { Games, GameId } from '../games';

const validateCreate = Validator(CharacterSchemas.create);
const validateUpdate = Validator(CharacterSchemas.update);

const controlUser = async (userId: string): Promise<User> => (
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
        const { userId } = params;
        await controlUser(userId);
        validateCreate(body);
        const { gameId, name, data } = body;
        if (!Object.keys(Games).includes(gameId)) {
            throw new ValidationError(`Invalid gameId ${gameId}`);
        }
        Games[gameId as GameId].validator(data);
        const character = await Prisma.character.create({
            data: {
                userId,
                gameId,
                name,
                data
            }
        });
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
        const { gameId } = await handleNotFound<Character>(
            'Character', (
                Prisma.character.findUnique({
                    where: {
                        id: characterId
                    }
                })
            )
        );
        validateUpdate(body);
        if (body.data) {
            Games[gameId as GameId].validator(body.data);
        }
        const character = await Prisma.character.update({
            data: body,
            where: {
                id: characterId
            }
        });
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
