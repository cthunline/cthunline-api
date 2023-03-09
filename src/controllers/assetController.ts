import Fs from 'fs';
import Path from 'path';
import { Router, Request, Response } from 'express';
import Formidable from 'formidable';

import { ValidationError } from '../services/errors';
import { parseParamId } from '../services/tools';
import Validator from '../services/validator';
import { Prisma } from '../services/prisma';
import { TypedFile } from '../types/asset';
import Log from '../services/log';
import {
    controlFile,
    assetDir,
    assetTempDir,
    controlUserDir,
    formidableOptions,
    getAsset,
    getDirectories,
    getDirectory,
    getChildrenDirectories
} from './helpers/asset';

import assetSchemas from './schemas/asset.json';

const validateUploadAssets = Validator(assetSchemas.uploadAssets);
const validateCreateDirectory = Validator(assetSchemas.createDirectory);
const validateUpdateDirectory = Validator(assetSchemas.updateDirectory);

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

const assetController = Router();

// get all assets of the authenticated user
assetController.get(
    '/assets',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user.id;
            const { type, include } = req.query;
            const assets = await Prisma.asset.findMany({
                where: {
                    userId,
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
            res.json({ assets });
        } catch (err: any) {
            res.error(err);
        }
    }
);

// upload an asset for the authenticated user
// this endpoint expect multipart/form-data
assetController.post(
    '/assets',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user.id;
            // create user subdirectory if not exist
            const userDir = await controlUserDir(userId);
            // initialize formidable
            const form = Formidable(formidableOptions);
            // parse form data
            form.parse(req, async (err, fields, files) => {
                try {
                    // file controls
                    if (err) {
                        throw new ValidationError('Error while parsing file');
                    }
                    // validates body
                    validateUploadAssets({
                        ...fields,
                        ...files
                    });
                    // control directoryId
                    const directoryId = fields.directoryId
                        ? Number(fields.directoryId)
                        : null;
                    if (directoryId !== null) {
                        await getDirectory(userId, directoryId);
                    }
                    // get files data
                    const assetFiles = Array.isArray(files.assets)
                        ? files.assets
                        : [files.assets];
                    const typedAssetFiles: TypedFile[] = assetFiles.map(
                        (file) => ({
                            ...file,
                            type: controlFile(file)
                        })
                    );
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
                                const path = Path.join(
                                    userId.toString(),
                                    newFilename
                                );
                                return Prisma.asset.create({
                                    data: {
                                        userId,
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
                    res.json({ assets });
                } catch (formErr: any) {
                    res.error(formErr);
                }
            });
        } catch (err: any) {
            res.error(err);
        }
    }
);

// get an asset belonging to the athenticated user
assetController.get(
    '/assets/:assetId',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user.id;
            const assetId = parseParamId(req.params, 'assetId');
            const asset = await getAsset(userId, assetId);
            res.json(asset);
        } catch (err: any) {
            res.error(err);
        }
    }
);

// delete an asset belonging to the authenticated user
assetController.delete(
    '/assets/:assetId',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user.id;
            const assetId = parseParamId(req.params, 'assetId');
            const { path } = await getAsset(userId, assetId);
            await Promise.all([
                Prisma.asset.delete({
                    where: {
                        id: assetId
                    }
                }),
                Fs.promises.rm(Path.join(assetDir, path))
            ]);
            res.send({});
        } catch (err: any) {
            res.error(err);
        }
    }
);

// get all directories of the authenticated user
assetController.get(
    '/directories',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user.id;
            const directories = await getDirectories(userId);
            res.json({ directories });
        } catch (err: any) {
            res.error(err);
        }
    }
);

// create directory for the authenticated user
assetController.post(
    '/directories',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user.id;
            const { parentId } = req.body;
            validateCreateDirectory(req.body);
            if (parentId) {
                await getDirectory(userId, parentId);
            }
            const directory = await Prisma.directory.create({
                data: {
                    ...req.body,
                    userId
                }
            });
            res.json(directory);
        } catch (err: any) {
            res.error(err);
        }
    }
);

// get a directory belonging to the authenticated user
assetController.get(
    '/directories/:directoryId',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user.id;
            const directoryId = parseParamId(req.params, 'directoryId');
            const directory = await getDirectory(userId, directoryId);
            res.json(directory);
        } catch (err: any) {
            res.error(err);
        }
    }
);

// update a directory belonging to the authenticated user
assetController.post(
    '/directories/:directoryId',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user.id;
            const directoryId = parseParamId(req.params, 'directoryId');
            await getDirectory(userId, directoryId);
            validateUpdateDirectory(req.body);
            const directory = await Prisma.directory.update({
                data: req.body,
                where: {
                    id: directoryId
                }
            });
            res.json(directory);
        } catch (err: any) {
            res.error(err);
        }
    }
);

// delete a directory belonging to the authenticated user
assetController.delete(
    '/directories/:directoryId',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user.id;
            const directoryId = parseParamId(req.params, 'directoryId');
            await getDirectory(userId, directoryId);
            // get all directories of the user
            const directories = await getDirectories(userId);
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
                    userId,
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
            res.send({});
        } catch (err: any) {
            res.error(err);
        }
    }
);

export default assetController;
