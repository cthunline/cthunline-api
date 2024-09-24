import fs from 'node:fs';
import path from 'node:path';
import type { Character as CharacterData } from '@cthunline/games';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { parseParamId } from '../services/api.js';
import {
    ConflictError,
    InternError,
    ValidationError
} from '../services/errors.js';
import { type GameId, games, isValidGameId } from '../services/games.js';
import {
    cleanMultipartFiles,
    parseMultipartBody
} from '../services/multipart.js';
import {
    createCharacter,
    deleteCharacterById,
    getCharacterByIdOrThrow,
    getCharacters,
    updateCharacterById
} from '../services/queries/character.js';
import { getUserByIdOrThrow } from '../services/queries/user.js';
import { validateSchema } from '../services/typebox.js';
import type { QueryParam } from '../types/api.js';
import { assetDir, controlFile } from './helpers/asset.js';
import { controlSelf } from './helpers/auth.js';
import {
    controlPortraitDir,
    deleteCachedCharacter,
    getPortraitMultipartOptions,
    portraitDirName,
    updateCachedCharacterIfExists
} from './helpers/character.js';
import {
    type CreateCharacterBody,
    type UpdateCharacterBody,
    createCharacterSchema,
    updateCharacterSchema,
    uploadPortraitSchema
} from './schemas/character.js';

export const characterController = async (app: FastifyInstance) => {
    // biome-ignore lint/suspicious/useAwait: fastify controllers require async

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
            const userId = query.user ? Number(query.user) : undefined;
            if (userId) {
                await getUserByIdOrThrow(userId);
            }
            const characters = await getCharacters(userId);
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
            validateSchema(games[gameId].schema, data);
            const character = await createCharacter({
                userId,
                gameId,
                name,
                data: data as CharacterData
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
            const character = await getCharacterByIdOrThrow(characterId);
            rep.send(character);
        }
    });

    // edit a character
    app.route({
        method: 'PATCH',
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
            const { gameId, userId } =
                await getCharacterByIdOrThrow(characterId);
            controlSelf(userId, user);
            if (body.data) {
                validateSchema(games[gameId as GameId].schema, body.data);
            }
            const character = await updateCharacterById(
                characterId,
                body as typeof body & { data?: CharacterData }
            );
            await updateCachedCharacterIfExists(character);
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
            const { userId } = await getCharacterByIdOrThrow(characterId);
            controlSelf(userId, user);
            await deleteCharacterById(characterId);
            await deleteCachedCharacter(characterId);
            rep.send({});
        }
    });

    // set a character portrait
    app.route({
        method: 'POST',
        url: '/characters/:characterId/portrait',
        onResponse: async () => {
            await cleanMultipartFiles();
        },
        handler: async (
            req: FastifyRequest<{
                Params: {
                    characterId: string;
                };
            }>,
            rep: FastifyReply
        ) => {
            const { user } = req;
            const characterId = parseParamId(req.params, 'characterId');
            const character = await getCharacterByIdOrThrow(characterId);
            const options = getPortraitMultipartOptions();
            const body = await parseMultipartBody({
                app,
                req,
                schema: uploadPortraitSchema,
                ...options
            });
            controlSelf(character.userId, user);
            // get portraits directory
            const portraitDirPath = await controlPortraitDir();
            // get file data
            const file = body.portrait.shift();
            if (!file) {
                throw new InternError('Could not get portrait file');
            }
            const typedFile = {
                ...file,
                type: controlFile(file, 'image')
            };
            // move temporary file to character's directory
            const { filePath, fileName } = typedFile;
            const portraitFileName = `${characterId}${path.extname(fileName)}`;
            await fs.promises.rename(
                filePath,
                path.join(portraitDirPath, portraitFileName)
            );
            // save portrait on character
            const portrait = path.join(portraitDirName, portraitFileName);
            const updatedCharacter = await updateCharacterById(characterId, {
                portrait
            });
            await updateCachedCharacterIfExists(updatedCharacter);
            // if there was a portrait before that has a different name then delete it
            if (
                character.portrait &&
                character.portrait !== updatedCharacter.portrait
            ) {
                await fs.promises.rm(path.join(assetDir, character.portrait));
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
            const character = await getCharacterByIdOrThrow(characterId);
            controlSelf(character.userId, user);
            if (character.portrait) {
                const [updatedCharacter] = await Promise.all([
                    updateCharacterById(characterId, { portrait: null }),
                    fs.promises.rm(path.join(assetDir, character.portrait))
                ]);
                await updateCachedCharacterIfExists(updatedCharacter);
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
                getCharacterByIdOrThrow(characterId),
                getUserByIdOrThrow(targetUserId)
            ]);
            controlSelf(character.userId, user);
            if (targetUser.id === user.id) {
                throw new ConflictError(
                    'You cannot transfer a character to yourself'
                );
            }
            const updatedCharacter = await updateCharacterById(characterId, {
                userId: targetUserId
            });
            await updateCachedCharacterIfExists(updatedCharacter);
            rep.send({});
        }
    });
};
