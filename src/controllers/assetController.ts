import fs from 'node:fs';
import path from 'node:path';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { log } from '../services/log.js';
import { cleanMultipartFiles, parseMultipart } from '../services/multipart.js';
import {
    createAssets,
    deleteAssetById,
    deleteAssetsByIds,
    getUserAssetByIdOrThrow,
    getUserAssets,
    getUserDirectoriesAssets
} from '../services/queries/asset.js';
import {
    createDirectory,
    deleteDirectoryById,
    getUserDirectories,
    getUserDirectoryByIdOrThrow,
    updateDirectoryById
} from '../services/queries/directory.js';
import type { TypedFile } from '../types/asset.js';
import {
    assetDir,
    assetTempDir,
    controlFile,
    controlUserDir,
    getAssetMultipartOptions,
    getChildrenDirectories
} from './helpers/asset.js';
import {
    type CreateDirectoryBody,
    type UpdateDirectoryBody,
    createDirectorySchema,
    updateDirectorySchema,
    uploadAssetsFieldsSchema,
    uploadAssetsFilesSchema
} from './schemas/asset.js';
import {
    type AssetIdParam,
    type DirectoryIdParam,
    assetIdParamSchema,
    directoryIdParamSchema
} from './schemas/params.js';
import { type AssetTypeQuery, assetTypeQuerySchema } from './schemas/query.js';

// create subdirectory for temporary uploads in asset dir if not exist and return its path
(async () => {
    const tempDir = assetTempDir;
    try {
        await fs.promises.access(tempDir, fs.constants.F_OK);
    } catch {
        log.info(`Creating temporary upload directory ${tempDir}`);
        await fs.promises.mkdir(tempDir);
    }
    return tempDir;
})();

export const assetController = async (app: FastifyInstance) => {
    // get all assets of the authenticated user
    app.route({
        method: 'GET',
        url: '/assets',
        schema: {
            querystring: assetTypeQuerySchema
        },
        handler: async (
            {
                query: { type },
                user
            }: FastifyRequest<{
                Querystring: AssetTypeQuery;
            }>,
            rep: FastifyReply
        ) => {
            const assets = await getUserAssets(user.id, type);
            rep.send({ assets });
        }
    });

    // upload an asset for the authenticated user
    // this endpoint expect multipart/form-data
    app.route({
        method: 'POST',
        url: '/assets',
        onResponse: async () => {
            await cleanMultipartFiles();
        },
        handler: async (req: FastifyRequest, rep: FastifyReply) => {
            const { user } = req;
            const fileOptions = getAssetMultipartOptions();
            const { files, fields } = await parseMultipart({
                app,
                req,
                schema: {
                    files: uploadAssetsFilesSchema,
                    fields: uploadAssetsFieldsSchema
                },
                ...fileOptions
            });
            // create user subdirectory if not exist
            const userDir = await controlUserDir(user.id);
            // control directoryId
            const directoryId = fields?.directoryId
                ? Number(fields.directoryId)
                : null;
            if (directoryId !== null) {
                await getUserDirectoryByIdOrThrow(user.id, directoryId);
            }
            const typedAssetFiles: TypedFile[] = files.assets.map((file) => ({
                ...file,
                type: controlFile(file)
            }));
            // move temporary files to user's directory
            await Promise.all(
                typedAssetFiles.map(({ filePath, fileName }) =>
                    (async () => {
                        // we copy then delete source instead of moving/renaming
                        // because moving/renaming can fail if source and destination
                        // are on different partition
                        await fs.promises.copyFile(
                            filePath,
                            path.join(userDir, fileName)
                        );
                        await fs.promises.unlink(filePath);
                    })()
                )
            );
            // save assets in database
            const assets = await createAssets(
                typedAssetFiles.map(({ fileName, type }) => {
                    const assetPath = path.join(user.id.toString(), fileName);
                    return {
                        userId: user.id,
                        directoryId,
                        type,
                        name: fileName,
                        path: assetPath
                    };
                })
            );
            //
            rep.send({ assets });
        }
    });

    // get an asset belonging to the athenticated user
    app.route({
        method: 'GET',
        url: '/assets/:assetId',
        schema: {
            params: assetIdParamSchema
        },
        handler: async (
            {
                params: { assetId },
                user
            }: FastifyRequest<{
                Params: AssetIdParam;
            }>,
            rep: FastifyReply
        ) => {
            const asset = await getUserAssetByIdOrThrow(user.id, assetId);
            rep.send(asset);
        }
    });

    // delete an asset belonging to the authenticated user
    app.route({
        method: 'DELETE',
        url: '/assets/:assetId',
        schema: {
            params: assetIdParamSchema
        },
        handler: async (
            {
                params: { assetId },
                user
            }: FastifyRequest<{
                Params: AssetIdParam;
            }>,
            rep: FastifyReply
        ) => {
            const { path: assetPath } = await getUserAssetByIdOrThrow(
                user.id,
                assetId
            );
            await Promise.all([
                deleteAssetById(assetId),
                fs.promises.rm(path.join(assetDir, assetPath))
            ]);
            rep.send({});
        }
    });

    // get all directories of the authenticated user
    app.route({
        method: 'GET',
        url: '/directories',
        handler: async ({ user }: FastifyRequest, rep: FastifyReply) => {
            const directories = await getUserDirectories(user.id);
            rep.send({ directories });
        }
    });

    // create directory for the authenticated user
    app.route({
        method: 'POST',
        url: '/directories',
        schema: { body: createDirectorySchema },
        handler: async (
            {
                body,
                user
            }: FastifyRequest<{
                Body: CreateDirectoryBody;
            }>,
            rep: FastifyReply
        ) => {
            const { parentId } = body;
            if (parentId) {
                await getUserDirectoryByIdOrThrow(user.id, parentId);
            }
            const directory = await createDirectory({
                ...body,
                userId: user.id
            });
            rep.send(directory);
        }
    });

    // get a directory belonging to the authenticated user
    app.route({
        method: 'GET',
        url: '/directories/:directoryId',
        schema: {
            params: directoryIdParamSchema
        },
        handler: async (
            {
                user,
                params: { directoryId }
            }: FastifyRequest<{
                Params: DirectoryIdParam;
                Body: CreateDirectoryBody;
            }>,
            rep: FastifyReply
        ) => {
            const directory = await getUserDirectoryByIdOrThrow(
                user.id,
                directoryId
            );
            rep.send(directory);
        }
    });

    // update a directory belonging to the authenticated user
    app.route({
        method: 'PATCH',
        url: '/directories/:directoryId',
        schema: {
            params: directoryIdParamSchema,
            body: updateDirectorySchema
        },
        handler: async (
            {
                body,
                params: { directoryId },
                user
            }: FastifyRequest<{
                Params: DirectoryIdParam;
                Body: UpdateDirectoryBody;
            }>,
            rep: FastifyReply
        ) => {
            await getUserDirectoryByIdOrThrow(user.id, directoryId);
            const directory = await updateDirectoryById(directoryId, body);
            rep.send(directory);
        }
    });

    // delete a directory belonging to the authenticated user
    app.route({
        method: 'DELETE',
        url: '/directories/:directoryId',
        schema: {
            params: directoryIdParamSchema
        },
        handler: async (
            {
                params: { directoryId },
                user
            }: FastifyRequest<{
                Params: DirectoryIdParam;
            }>,
            rep: FastifyReply
        ) => {
            await getUserDirectoryByIdOrThrow(user.id, directoryId);
            // get all directories of the user
            const directories = await getUserDirectories(user.id);
            // get all children directories
            const childrenDirectories = getChildrenDirectories(
                directoryId,
                directories
            );
            const childrenDirectoryIds = childrenDirectories.map(
                ({ id }) => id
            );
            const assetDirectoryIds = [directoryId, ...childrenDirectoryIds];
            if (assetDirectoryIds.length) {
                // get assets within all children directories
                const assets = await getUserDirectoriesAssets(
                    user.id,
                    assetDirectoryIds
                );
                if (assets.length) {
                    // delete all children assets
                    await Promise.all([
                        deleteAssetsByIds(assets.map(({ id }) => id)),
                        ...assets.map(({ path: assetPath }) =>
                            fs.promises.rm(path.join(assetDir, assetPath))
                        )
                    ]);
                }
            }
            // delete directory (children directories will cascade-deleted)
            await deleteDirectoryById(directoryId);
            rep.send({});
        }
    });
};
