import {
    Router,
    Request,
    Response
} from 'express';
import { Character } from '@prisma/client';

import { findUser } from './user';
import { controlSelf } from './auth';
import { Prisma, handleNotFound } from '../services/prisma';
import Validator from '../services/validator';
import { ValidationError } from '../services/errors';
import { Games, GameId, isValidGameId } from '../games';

import { isBase64 } from '../services/tools';
import { mimeTypes } from '../types/asset';
import CharacterSchemas from './schemas/character.json';

const imageMimeTypes = Object.entries(mimeTypes).filter(
    ([, { type }]) => type === 'image'
).map(
    ([mimeType]) => mimeType
);

const portraitLimitSizeInKb = 300;
const controlPortrait = (base64: string) => {
    if (!isBase64(base64, imageMimeTypes)) {
        throw new ValidationError('Portrait is not a valid base64 string');
    }
    const buffer = Buffer.from(base64);
    const sizeInKb = buffer.length / 1000;
    if (sizeInKb > portraitLimitSizeInKb) {
        throw new ValidationError(`Portrait is too big (max ${portraitLimitSizeInKb}Kb)`);
    }
};

const validateCreate = Validator(CharacterSchemas.create);
const validateUpdate = Validator(CharacterSchemas.update);

const characterRouter = Router();

// get all characters
characterRouter.get('/characters', async (req: Request, res: Response): Promise<void> => {
    try {
        const characters = await Prisma.character.findMany();
        res.json({ characters });
    } catch (err: any) {
        res.error(err);
    }
});

// get all characters of a user
characterRouter.get('/users/:userId/characters', async ({ params }: Request, res: Response): Promise<void> => {
    try {
        const { userId } = params;
        await findUser(userId);
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
characterRouter.post('/users/:userId/characters', async ({ body, params, token }: Request, res: Response): Promise<void> => {
    try {
        const { userId } = params;
        await findUser(userId);
        controlSelf(token, userId);
        validateCreate(body);
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
characterRouter.get('/characters/:characterId', async ({ params }: Request, res: Response): Promise<void> => {
    try {
        const { characterId } = params;
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

// edit a character
characterRouter.post('/characters/:characterId', async ({ params, body, token }: Request, res: Response): Promise<void> => {
    try {
        const { characterId } = params;
        const { gameId, userId } = await handleNotFound<Character>(
            'Character', (
                Prisma.character.findUnique({
                    where: {
                        id: characterId
                    }
                })
            )
        );
        controlSelf(token, userId);
        validateUpdate(body);
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
characterRouter.delete('/characters/:characterId', async ({ params, token }: Request, res: Response): Promise<void> => {
    try {
        const { characterId } = params;
        const { userId } = await handleNotFound<Character>(
            'Character', (
                Prisma.character.findUnique({
                    where: {
                        id: characterId
                    }
                })
            )
        );
        controlSelf(token, userId);
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
