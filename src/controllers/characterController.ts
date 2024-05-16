import {
    type FastifyInstance,
    type FastifyRequest,
    type FastifyReply
} from 'fastify';
import { type Character as CharacterData } from '@cthunline/games';
import path from 'path';
import fs from 'fs';

import { games, type GameId, isValidGameId } from '../services/games.js';
import { getUserByIdOrThrow } from '../services/queries/user.js';
import { assetDir, controlFile } from './helpers/asset.js';
import { validateSchema } from '../services/typebox.js';
import { type QueryParam } from '../types/api.js';
import { parseParamId } from '../services/api.js';
import { controlSelf } from './helpers/auth.js';
import {
    ConflictError,
    InternError,
    ValidationError
} from '../services/errors.js';
import {
    getFormidablePortraitOptions,
    controlPortraitDir,
    portraitDirName,
    updateCachedCharacterIfExists,
    deleteCachedCharacter
} from './helpers/character.js';
import {
    createCharacterSchema,
    type CreateCharacterBody,
    updateCharacterSchema,
    type UpdateCharacterBody,
    uploadPortraitSchema
} from './schemas/character.js';
import {
    createCharacter,
    deleteCharacterById,
    getCharacterByIdOrThrow,
    getCharacters,
    updateCharacterById
} from '../services/queries/character.js';

export const characterController = async (app: FastifyInstance) => {
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
            const character = await getCharacterByIdOrThrow(characterId);
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
            await fs.promises.rename(
                temporaryPath,
                path.join(portraitDirPath, portraitFileName)
            );
            // save portrait on character
            const portrait = path.join(portraitDirName, portraitFileName);
            const updatedCharacter = await updateCharacterById(characterId, {
                portrait
            });
            await updateCachedCharacterIfExists(updatedCharacter);
            // if there was a portrait before then delete it
            if (character.portrait) {
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
