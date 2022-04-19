import {
    Router,
    Request,
    Response
} from 'express';

import { getUser } from '../services/controllerServices/user';
import { controlSelf } from '../services/controllerServices/auth';
import { Prisma } from '../services/prisma';
import Validator from '../services/validator';
import { ValidationError } from '../services/errors';
import { Games, GameId, isValidGameId } from '../games';
import { controlPortrait, getCharacter } from '../services/controllerServices/character';

import CharacterSchemas from './schemas/character.json';

const validateCreateCharacter = Validator(CharacterSchemas.create);
const validateUpdateCharacter = Validator(CharacterSchemas.update);

const characterController = Router();

// get all characters
characterController.get('/characters', async (req: Request, res: Response): Promise<void> => {
    try {
        const characters = await Prisma.character.findMany();
        res.json({ characters });
    } catch (err: any) {
        res.error(err);
    }
});

// get all characters of a user
characterController.get('/users/:userId/characters', async ({ params }: Request, res: Response): Promise<void> => {
    try {
        const { userId } = params;
        await getUser(userId);
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

// create a character for a user
characterController.post('/users/:userId/characters', async (req: Request, res: Response): Promise<void> => {
    try {
        const { body, params } = req;
        const { userId } = params;
        await getUser(userId);
        controlSelf(req, userId);
        validateCreateCharacter(body);
        const { gameId, name, data } = body;
        if (!isValidGameId(gameId)) {
            throw new ValidationError(`Invalid gameId ${gameId}`);
        }
        Games[gameId as GameId].validator(data);
        if (data.portrait) {
            controlPortrait(data.portrait);
        }
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

// get a character
characterController.get('/characters/:characterId', async ({ params }: Request, res: Response): Promise<void> => {
    try {
        const { characterId } = params;
        const character = await getCharacter(characterId);
        res.json(character);
    } catch (err: any) {
        res.error(err);
    }
});

// edit a character
characterController.post('/characters/:characterId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { body, params } = req;
        const { characterId } = params;
        const { gameId, userId } = await getCharacter(characterId);
        controlSelf(req, userId);
        validateUpdateCharacter(body);
        if (body.data) {
            Games[gameId as GameId].validator(body.data);
            if (body.data.portrait) {
                controlPortrait(body.data.portrait);
            }
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

// delete a user's character
characterController.delete('/characters/:characterId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { params } = req;
        const { characterId } = params;
        const { userId } = await getCharacter(characterId);
        controlSelf(req, userId);
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

export default characterController;
