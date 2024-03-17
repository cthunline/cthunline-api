import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Formidable from 'formidable';
import Path from 'path';
import Fs from 'fs';

import { ValidationError } from '../services/errors.js';
import { validateSchema } from '../services/typebox.js';
import { parseParamId } from '../services/api.js';
import { Prisma } from '../services/prisma.js';
import Log from '../services/log.js';

import {
    controlFile,
    assetDir,
    assetTempDir,
    controlUserDir,
    getFormidableOptions,
    getAsset,
    getDirectories,
    getDirectory,
    getChildrenDirectories
} from './helpers/asset.js';

import { TypedFile } from '../types/asset.js';
import { QueryParam } from '../types/api.js';

import {
    createDirectorySchema,
    CreateDirectoryBody,
    updateDirectorySchema,
    UpdateDirectoryBody,
    uploadAssetsSchema,
    UploadAssetsBody
} from './schemas/asset.js';

// create subdirectory for temporary uploads in asset dir if not exist and return its path
(async () => {
    const tempDir = assetTempDir;
    try {
        await Fs.promises.access(tempDir, Fs.constants.F_OK);
    } catch {
        Log.info(`Creating temporary upload directory ${tempDir}`);
        await Fs.promises.mkdir(tempDir);
    }
    return tempDir;
})();

const assetController = async (app: FastifyInstance) => {
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
                    include?: QueryParam;
                };
            }>,
            rep: FastifyReply
        ) => {
            const { type, include } = query;
            const assets = await Prisma.asset.findMany({
                where: {
                    userId: user.id,
                    ...(type
                        ? {
                              type: String(type)
                          }
                        : {})
                },
                include: {
                    directory: include === 'true'
                }
            });
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
                await getDirectory(user.id, directoryId);
            }
            // get files data
            const assetFiles: Formidable.File[] = [];
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
                        Fs.promises.rename(
                            temporaryPath,
                            Path.join(userDir, newFilename)
                        )
                )
            );
            // save assets in database
            const assets = await Prisma.$transaction(
                typedAssetFiles.map(
                    ({ originalFilename, newFilename, type }) => {
                        const name = originalFilename ?? newFilename;
                        const path = Path.join(user.id.toString(), newFilename);
                        return Prisma.asset.create({
                            data: {
                                userId: user.id,
                                directoryId,
                                type,
                                name,
                                path
                            }
                        });
                    }
                )
            );
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
            const asset = await getAsset(user.id, assetId);
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
            const { path } = await getAsset(user.id, assetId);
            await Promise.all([
                Prisma.asset.delete({
                    where: {
                        id: assetId
                    }
                }),
                Fs.promises.rm(Path.join(assetDir, path))
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
            const directories = await getDirectories(user.id);
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
                await getDirectory(user.id, parentId);
            }
            const directory = await Prisma.directory.create({
                data: {
                    ...body,
                    userId: user.id
                }
            });
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
            const directory = await getDirectory(user.id, directoryId);
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
            await getDirectory(user.id, directoryId);
            const directory = await Prisma.directory.update({
                data: body,
                where: {
                    id: directoryId
                }
            });
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
            await getDirectory(user.id, directoryId);
            // get all directories of the user
            const directories = await getDirectories(user.id);
            // get all children directories
            const childrenDirectories = getChildrenDirectories(
                directoryId,
                directories
            );
            const childrenDirectoryIds = childrenDirectories.map(
                ({ id }) => id
            );
            // get assets within all children directories
            const assets = await Prisma.asset.findMany({
                where: {
                    userId: user.id,
                    directoryId: {
                        in: childrenDirectoryIds
                    }
                }
            });
            // delete all children assets
            await Promise.all([
                Prisma.$transaction(
                    assets.map(({ id }) =>
                        Prisma.asset.delete({
                            where: { id }
                        })
                    )
                ),
                ...assets.map(({ path }) =>
                    Fs.promises.rm(Path.join(assetDir, path))
                )
            ]);
            // delete directory (children directories will cascade-deleted)
            await Prisma.directory.delete({
                where: {
                    id: directoryId
                }
            });
            rep.send({});
        }
    });
};

export default assetController;
