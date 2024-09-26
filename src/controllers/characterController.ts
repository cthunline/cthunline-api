import fs from 'node:fs';
import path from 'node:path';
import type { Character as CharacterData } from '@cthunline/games';
import { Type } from '@sinclair/typebox';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import {
    ConflictError,
    InternError,
    ValidationError
} from '../services/errors.js';
import { type GameId, games, isValidGameId } from '../services/games.js';
import { cleanMultipartFiles, parseMultipart } from '../services/multipart.js';
import {
    createCharacter,
    deleteCharacterById,
    getCharacterByIdOrThrow,
    getCharacters,
    updateCharacterById
} from '../services/queries/character.js';
import { getUserByIdOrThrow } from '../services/queries/user.js';
import { validateSchema } from '../services/typebox.js';
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
    uploadPortraitFilesSchema
} from './schemas/character.js';
import {
    type CharacterIdParam,
    type UserIdParam,
    characterIdParamSchema,
    userIdParamSchema
} from './schemas/params.js';
import { type UserQuery, userQuerySchema } from './schemas/query.js';

export const characterController = async (app: FastifyInstance) => {
    // biome-ignore lint/suspicious/useAwait: fastify controllers require async

    // get all characters
    // can filter on a userId by providing a 'user' query parameter
    app.route({
        method: 'GET',
        url: '/characters',
        schema: {
            querystring: userQuerySchema
        },
        handler: async (
            {
                query: { user: userId }
            }: FastifyRequest<{
                Querystring: UserQuery;
            }>,
            rep: FastifyReply
        ) => {
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
        schema: {
            params: characterIdParamSchema
        },
        handler: async (
            {
                params: { characterId }
            }: FastifyRequest<{
                Params: CharacterIdParam;
            }>,
            rep: FastifyReply
        ) => {
            const character = await getCharacterByIdOrThrow(characterId);
            rep.send(character);
        }
    });

    // edit a character
    app.route({
        method: 'PATCH',
        url: '/characters/:characterId',
        schema: {
            params: characterIdParamSchema,
            body: updateCharacterSchema
        },
        handler: async (
            {
                body,
                params: { characterId },
                user
            }: FastifyRequest<{
                Params: CharacterIdParam;
                Body: UpdateCharacterBody;
            }>,
            rep: FastifyReply
        ) => {
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
        schema: {
            params: characterIdParamSchema
        },
        handler: async (
            {
                params: { characterId },
                user
            }: FastifyRequest<{
                Params: CharacterIdParam;
            }>,
            rep: FastifyReply
        ) => {
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
        schema: {
            params: characterIdParamSchema
        },
        onResponse: async () => {
            await cleanMultipartFiles();
        },
        handler: async (
            req: FastifyRequest<{
                Params: CharacterIdParam;
            }>,
            rep: FastifyReply
        ) => {
            const {
                user,
                params: { characterId }
            } = req;
            const character = await getCharacterByIdOrThrow(characterId);
            const options = getPortraitMultipartOptions();
            const { files } = await parseMultipart({
                app,
                req,
                schema: {
                    files: uploadPortraitFilesSchema,
                    fields: false
                },
                ...options
            });
            controlSelf(character.userId, user);
            // get portraits directory
            const portraitDirPath = await controlPortraitDir();
            // get file data
            const file = files.portrait[0];
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
        schema: {
            params: characterIdParamSchema
        },
        handler: async (
            {
                params: { characterId },
                user
            }: FastifyRequest<{
                Params: CharacterIdParam;
            }>,
            rep: FastifyReply
        ) => {
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
        schema: {
            params: Type.Composite(
                [characterIdParamSchema, userIdParamSchema],
                {
                    additionalProperties: false
                }
            )
        },
        handler: async (
            {
                params: { characterId, userId: targetUserId },
                user
            }: FastifyRequest<{
                Params: CharacterIdParam & UserIdParam;
            }>,
            rep: FastifyReply
        ) => {
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
