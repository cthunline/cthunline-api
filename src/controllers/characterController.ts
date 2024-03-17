import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Prisma as PrismaNS } from '@prisma/client';
import Path from 'path';
import Fs from 'fs';

import {
    ConflictError,
    InternError,
    ValidationError
} from '../services/errors.js';
import { Games, GameId, isValidGameId } from '../services/games.js';
import { parseParamId } from '../services/api.js';
import { Prisma } from '../services/prisma.js';

import { assetDir, controlFile } from './helpers/asset.js';
import { validateSchema } from '../services/typebox.js';
import { controlSelf } from './helpers/auth.js';
import { getUser } from './helpers/user.js';
import {
    getCharacter,
    getFormidablePortraitOptions,
    controlPortraitDir,
    portraitDirName
} from './helpers/character.js';

import { QueryParam } from '../types/api.js';

import {
    createCharacterSchema,
    CreateCharacterBody,
    updateCharacterSchema,
    UpdateCharacterBody,
    uploadPortraitSchema
} from './schemas/character.js';

const characterController = async (app: FastifyInstance) => {
    // get all characters
    // can filter on a userId by providing a 'user' query parameter
    app.route({
        method: 'GET',
        url: '/characters',
        handler: async (
            {
                query
            }: FastifyRequest<{
                Querystring: {
                    user?: QueryParam;
                };
            }>,
            rep: FastifyReply
        ) => {
            const userId = query.user ? Number(query.user) : null;
            const options: PrismaNS.CharacterFindManyArgs = {};
            if (userId) {
                await getUser(userId);
                options.where = { userId };
            }
            const characters = await Prisma.character.findMany(options);
            rep.send({ characters });
        }
    });

    // create a character for a user
    app.route({
        method: 'POST',
        url: '/characters',
        schema: { body: createCharacterSchema },
        handler: async (
            {
                body,
                user
            }: FastifyRequest<{
                Body: CreateCharacterBody;
            }>,
            rep: FastifyReply
        ) => {
            const userId = user.id;
            const { gameId, name, data } = body;
            if (!isValidGameId(gameId)) {
                throw new ValidationError(`Invalid gameId ${gameId}`);
            }
            validateSchema(Games[gameId as GameId].schema, data);
            const character = await Prisma.character.create({
                data: {
                    userId,
                    gameId,
                    name,
                    data
                }
            });
            rep.send(character);
        }
    });

    // get a character
    app.route({
        method: 'GET',
        url: '/characters/:characterId',
        handler: async (
            {
                params
            }: FastifyRequest<{
                Params: {
                    characterId: string;
                };
            }>,
            rep: FastifyReply
        ) => {
            const characterId = parseParamId(params, 'characterId');
            const character = await getCharacter(characterId);
            rep.send(character);
        }
    });

    // edit a character
    app.route({
        method: 'POST',
        url: '/characters/:characterId',
        schema: { body: updateCharacterSchema },
        handler: async (
            {
                body,
                params,
                user
            }: FastifyRequest<{
                Params: {
                    characterId: string;
                };
                Body: UpdateCharacterBody;
            }>,
            rep: FastifyReply
        ) => {
            const characterId = parseParamId(params, 'characterId');
            const { gameId, userId } = await getCharacter(characterId);
            controlSelf(userId, user);
            if (body.data) {
                validateSchema(Games[gameId as GameId].schema, body.data);
            }
            const character = await Prisma.character.update({
                data: body,
                where: {
                    id: characterId
                }
            });
            rep.send(character);
        }
    });

    // delete a user's character
    app.route({
        method: 'DELETE',
        url: '/characters/:characterId',
        handler: async (
            {
                params,
                user
            }: FastifyRequest<{
                Params: {
                    characterId: string;
                };
            }>,
            rep: FastifyReply
        ) => {
            const characterId = parseParamId(params, 'characterId');
            const { userId } = await getCharacter(characterId);
            controlSelf(userId, user);
            await Prisma.character.delete({
                where: {
                    id: characterId
                }
            });
            rep.send({});
        }
    });

    // set a character portrait
    app.route({
        method: 'POST',
        url: '/characters/:characterId/portrait',
        handler: async (
            req: FastifyRequest<{
                Params: {
                    characterId: string;
                };
            }>,
            rep: FastifyReply
        ) => {
            // parse form data
            try {
                await req.parseMultipart(getFormidablePortraitOptions());
            } catch {
                throw new ValidationError('Error while parsing file');
            }
            const { user, files } = req;
            const characterId = parseParamId(req.params, 'characterId');
            const character = await getCharacter(characterId);
            controlSelf(character.userId, user);
            // get portraits directory
            const portraitDirPath = await controlPortraitDir();
            // validate body
            validateSchema(uploadPortraitSchema, files);
            // get file data
            const file = Array.isArray(files?.portrait)
                ? files?.portrait?.shift()
                : files?.portrait;
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
            const portrait = Path.join(portraitDirName, portraitFileName);
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
                await Fs.promises.rm(Path.join(assetDir, character.portrait));
            }
            //
            rep.send(updatedCharacter);
        }
    });

    // delete a user's character
    app.route({
        method: 'DELETE',
        url: '/characters/:characterId/portrait',
        handler: async (
            {
                params,
                user
            }: FastifyRequest<{
                Params: {
                    characterId: string;
                };
            }>,
            rep: FastifyReply
        ) => {
            const characterId = parseParamId(params, 'characterId');
            const character = await getCharacter(characterId);
            controlSelf(character.userId, user);
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
                rep.send(updatedCharacter);
            } else {
                rep.send(character);
            }
        }
    });

    // transfer character ownership
    app.route({
        method: 'PUT',
        url: '/characters/:characterId/transfer/:userId',
        handler: async (
            {
                params,
                user
            }: FastifyRequest<{
                Params: {
                    characterId: string;
                    userId: string;
                };
            }>,
            rep: FastifyReply
        ) => {
            const characterId = parseParamId(params, 'characterId');
            const targetUserId = parseParamId(params, 'userId');
            const [character, targetUser] = await Promise.all([
                getCharacter(characterId),
                getUser(targetUserId)
            ]);
            controlSelf(character.userId, user);
            if (targetUser.id === user.id) {
                throw new ConflictError(
                    'You cannot transfer a character to yourself'
                );
            }
            await Prisma.character.update({
                data: {
                    userId: targetUserId
                },
                where: {
                    id: characterId
                }
            });
            rep.send({});
        }
    });
};

export default characterController;
