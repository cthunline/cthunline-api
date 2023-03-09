import { Router, Request, Response } from 'express';
import Fs from 'fs';
import Path from 'path';
import Formidable from 'formidable';
import { Prisma as PrismaNS } from '@prisma/client';

import { InternError, ValidationError } from '../services/errors';
import { Games, GameId, isValidGameId } from '../services/games';
import { assetDir, controlFile } from './helpers/asset';
import { parseParamId } from '../services/tools';
import Validator from '../services/validator';
import { controlSelf } from './helpers/auth';
import { Prisma } from '../services/prisma';
import { getUser } from './helpers/user';
import {
    getCharacter,
    formidablePortraitOptions,
    controlPortraitDir,
    portraitDirName
} from './helpers/character';

import characterSchemas from './schemas/character.json';

const validateCreateCharacter = Validator(characterSchemas.create);
const validateUpdateCharacter = Validator(characterSchemas.update);
const validateUploadPortrait = Validator(characterSchemas.uploadPortrait);

const characterController = Router();

// get all characters
// can filter on a userId by providing a 'user' query parameter
characterController.get(
    '/characters',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.query.user ? Number(req.query.user) : null;
            const options: PrismaNS.CharacterFindManyArgs = {};
            if (userId) {
                await getUser(userId);
                options.where = { userId };
            }
            const characters = await Prisma.character.findMany(options);
            res.json({ characters });
        } catch (err: any) {
            res.error(err);
        }
    }
);

// create a character for a user
characterController.post(
    '/characters',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { body, user } = req;
            const userId = user.id;
            validateCreateCharacter(body);
            const { gameId, name, data } = body;
            if (!isValidGameId(gameId)) {
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
    }
);

// get a character
characterController.get(
    '/characters/:characterId',
    async ({ params }: Request, res: Response): Promise<void> => {
        try {
            const characterId = parseParamId(params, 'characterId');
            const character = await getCharacter(characterId);
            res.json(character);
        } catch (err: any) {
            res.error(err);
        }
    }
);

// edit a character
characterController.post(
    '/characters/:characterId',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { body, params } = req;
            const characterId = parseParamId(params, 'characterId');
            const { gameId, userId } = await getCharacter(characterId);
            controlSelf(req, userId);
            validateUpdateCharacter(body);
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
    }
);

// delete a user's character
characterController.delete(
    '/characters/:characterId',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const characterId = parseParamId(req.params, 'characterId');
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
    }
);

// set a character portrait
characterController.post(
    '/characters/:characterId/portrait',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const characterId = parseParamId(req.params, 'characterId');
            const character = await getCharacter(characterId);
            controlSelf(req, character.userId);
            // get portraits directory
            const portraitDirPath = await controlPortraitDir();
            // initialize formidable
            const form = Formidable(formidablePortraitOptions);
            // parse form data
            form.parse(req, async (err, _fields, files) => {
                try {
                    // file controls
                    if (err) {
                        throw new ValidationError('Error while parsing file');
                    }
                    // validate body
                    validateUploadPortrait(files);
                    // get file data
                    const file = Array.isArray(files.portrait)
                        ? files.portrait.shift()
                        : files.portrait;
                    if (!file) {
                        throw new InternError('Could not get portrait file');
                    }
                    const typedFile = {
                        ...file,
                        type: controlFile(file, 'image')
                    };
                    // move temporary file to character's directory
                    const { filepath: temporaryPath, newFilename } = typedFile;
                    const portraitFileName = `${characterId}-${newFilename}`;
                    await Fs.promises.rename(
                        temporaryPath,
                        Path.join(portraitDirPath, portraitFileName)
                    );
                    // save portrait on character
                    const portrait = Path.join(
                        portraitDirName,
                        portraitFileName
                    );
                    const updatedCharacter = await Prisma.character.update({
                        data: {
                            portrait
                        },
                        where: {
                            id: characterId
                        }
                    });
                    // if there was a portrait before then delete it
                    if (character.portrait) {
                        await Fs.promises.rm(
                            Path.join(assetDir, character.portrait)
                        );
                    }
                    //
                    res.json(updatedCharacter);
                } catch (formErr: any) {
                    res.error(formErr);
                }
            });
        } catch (err: any) {
            res.error(err);
        }
    }
);

// delete a user's character
characterController.delete(
    '/characters/:characterId/portrait',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const characterId = parseParamId(req.params, 'characterId');
            const character = await getCharacter(characterId);
            controlSelf(req, character.userId);
            if (character.portrait) {
                const [updatedCharacter] = await Promise.all([
                    Prisma.character.update({
                        data: {
                            portrait: null
                        },
                        where: {
                            id: characterId
                        }
                    }),
                    Fs.promises.rm(Path.join(assetDir, character.portrait))
                ]);
                res.send(updatedCharacter);
            } else {
                res.send(character);
            }
        } catch (err: any) {
            res.error(err);
        }
    }
);

export default characterController;
