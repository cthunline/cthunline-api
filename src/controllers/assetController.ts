import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { type File as FormidableFile } from 'formidable';
import { and, eq, getTableColumns, inArray } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';

import { InternError, ValidationError } from '../services/errors.js';
import { validateSchema } from '../services/typebox.js';
import { type TypedFile } from '../types/asset.js';
import { type QueryParam } from '../types/api.js';
import { parseParamId } from '../services/api.js';
import { db, tables } from '../services/db.js';
import { log } from '../services/log.js';
import {
    createDirectorySchema,
    CreateDirectoryBody,
    updateDirectorySchema,
    UpdateDirectoryBody,
    uploadAssetsSchema,
    UploadAssetsBody
} from './schemas/asset.js';
import {
    controlFile,
    assetDir,
    assetTempDir,
    controlUserDir,
    getFormidableOptions,
    getUserAssetOrThrow,
    getUserDirectories,
    getChildrenDirectories,
    getUserDirectoryOrThrow
} from './helpers/asset.js';

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
        handler: async (
            {
                query,
                user
            }: FastifyRequest<{
                Querystring: {
                    type?: QueryParam;
                };
            }>,
            rep: FastifyReply
        ) => {
            const { type } = query;
            const assets = await db
                .select({
                    ...getTableColumns(tables.assets),
                    directory: getTableColumns(tables.directories)
                })
                .from(tables.assets)
                .where(
                    and(
                        eq(tables.assets.userId, user.id),
                        type ? eq(tables.assets.type, String(type)) : undefined
                    )
                )
                .leftJoin(
                    tables.directories,
                    eq(tables.assets.directoryId, tables.directories.id)
                );
            rep.send({ assets });
        }
    });

    // upload an asset for the authenticated user
    // this endpoint expect multipart/form-data
    app.route({
        method: 'POST',
        url: '/assets',
        handler: async (
            req: FastifyRequest<{
                Body: UploadAssetsBody;
            }>,
            rep: FastifyReply
        ) => {
            // parse form data
            try {
                await req.parseMultipart(getFormidableOptions());
            } catch {
                throw new ValidationError('Error while parsing file');
            }
            const { body, files, user } = req;
            // create user subdirectory if not exist
            const userDir = await controlUserDir(user.id);
            // validate body
            validateSchema(uploadAssetsSchema, {
                ...body,
                ...files
            });
            // control directoryId
            const directoryId = body.directoryId
                ? Number(body.directoryId)
                : null;
            if (directoryId !== null) {
                await getUserDirectoryOrThrow(directoryId, user.id);
            }
            // get files data
            const assetFiles: FormidableFile[] = [];
            if (files?.assets) {
                if (Array.isArray(files.assets)) {
                    assetFiles.push(...files.assets);
                } else {
                    assetFiles.push(files.assets);
                }
            }
            const typedAssetFiles: TypedFile[] = assetFiles.map((file) => ({
                ...file,
                type: controlFile(file)
            }));
            // move temporary files to user's directory
            await Promise.all(
                typedAssetFiles.map(
                    ({ filepath: temporaryPath, newFilename }) =>
                        fs.promises.rename(
                            temporaryPath,
                            path.join(userDir, newFilename)
                        )
                )
            );
            // save assets in database
            const assets = await db
                .insert(tables.assets)
                .values(
                    typedAssetFiles.map(
                        ({ originalFilename, newFilename, type }) => {
                            const name = originalFilename ?? newFilename;
                            const assetPath = path.join(
                                user.id.toString(),
                                newFilename
                            );
                            return {
                                userId: user.id,
                                directoryId,
                                type,
                                name,
                                path: assetPath
                            };
                        }
                    )
                )
                .returning();
            //
            rep.send({ assets });
        }
    });

    // get an asset belonging to the athenticated user
    app.route({
        method: 'GET',
        url: '/assets/:assetId',
        handler: async (
            {
                params,
                user
            }: FastifyRequest<{
                Params: {
                    assetId: string;
                };
            }>,
            rep: FastifyReply
        ) => {
            const assetId = parseParamId(params, 'assetId');
            const asset = await getUserAssetOrThrow(assetId, user.id);
            rep.send(asset);
        }
    });

    // delete an asset belonging to the authenticated user
    app.route({
        method: 'DELETE',
        url: '/assets/:assetId',
        handler: async (
            {
                params,
                user
            }: FastifyRequest<{
                Params: {
                    assetId: string;
                };
            }>,
            rep: FastifyReply
        ) => {
            const assetId = parseParamId(params, 'assetId');
            const { path: assetPath } = await getUserAssetOrThrow(
                assetId,
                user.id
            );
            await Promise.all([
                db.delete(tables.assets).where(eq(tables.assets.id, assetId)),
                fs.promises.rm(path.join(assetDir, assetPath))
            ]);
            rep.send({});
        }
    });

    // get all directories of the authenticated user
    app.route({
        method: 'GET',
        url: '/directories',
        handler: async (
            {
                user
            }: FastifyRequest<{
                Querystring: {
                    type?: QueryParam;
                    include?: QueryParam;
                };
            }>,
            rep: FastifyReply
        ) => {
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
                await getUserDirectoryOrThrow(parentId, user.id);
            }
            const createdDirectories = await db
                .insert(tables.directories)
                .values({
                    ...body,
                    userId: user.id
                })
                .returning();
            const directory = createdDirectories[0];
            if (!directory) {
                throw new InternError('Could not retreive inserted directory');
            }
            rep.send(directory);
        }
    });

    // get a directory belonging to the authenticated user
    app.route({
        method: 'GET',
        url: '/directories/:directoryId',
        handler: async (
            {
                user,
                params
            }: FastifyRequest<{
                Params: {
                    directoryId: string;
                };
                Body: CreateDirectoryBody;
            }>,
            rep: FastifyReply
        ) => {
            const directoryId = parseParamId(params, 'directoryId');
            const directory = await getUserDirectoryOrThrow(
                directoryId,
                user.id
            );
            rep.send(directory);
        }
    });

    // update a directory belonging to the authenticated user
    app.route({
        method: 'POST',
        url: '/directories/:directoryId',
        schema: { body: updateDirectorySchema },
        handler: async (
            {
                body,
                params,
                user
            }: FastifyRequest<{
                Params: {
                    directoryId: string;
                };
                Body: UpdateDirectoryBody;
            }>,
            rep: FastifyReply
        ) => {
            const directoryId = parseParamId(params, 'directoryId');
            await getUserDirectoryOrThrow(directoryId, user.id);
            const updatedDirectories = await db
                .update(tables.directories)
                .set(body)
                .where(eq(tables.directories.id, directoryId))
                .returning();
            const directory = updatedDirectories[0];
            if (!directory) {
                throw new InternError('Could not retreive updated directory');
            }
            rep.send(directory);
        }
    });

    // delete a directory belonging to the authenticated user
    app.route({
        method: 'DELETE',
        url: '/directories/:directoryId',
        handler: async (
            {
                params,
                user
            }: FastifyRequest<{
                Params: {
                    directoryId: string;
                };
            }>,
            rep: FastifyReply
        ) => {
            const directoryId = parseParamId(params, 'directoryId');
            await getUserDirectoryOrThrow(directoryId, user.id);
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
            if (childrenDirectoryIds.length) {
                // get assets within all children directories
                const assets = await db
                    .select()
                    .from(tables.assets)
                    .where(
                        and(
                            eq(tables.assets.userId, user.id),
                            inArray(
                                tables.assets.directoryId,
                                childrenDirectoryIds
                            )
                        )
                    );
                if (assets.length) {
                    // delete all children assets
                    await Promise.all([
                        db.delete(tables.assets).where(
                            inArray(
                                tables.assets.id,
                                assets.map(({ id }) => id)
                            )
                        ),
                        ...assets.map(({ path: assetPath }) =>
                            fs.promises.rm(path.join(assetDir, assetPath))
                        )
                    ]);
                }
            }
            // delete directory (children directories will cascade-deleted)
            await db
                .delete(tables.directories)
                .where(eq(tables.directories.id, directoryId));
            rep.send({});
        }
    });
};
