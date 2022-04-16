import Fs from 'fs';
import Path from 'path';
import {
    Router,
    Request,
    Response
} from 'express';
import Formidable from 'formidable';

import { getUser } from '../services/user';
import { controlSelf } from '../services/auth';
import { Prisma } from '../services/prisma';
import { ValidationError } from '../services/errors';
import Log from '../services/log';
import { TypedFile } from '../types/asset';
import Validator from '../services/validator';
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
} from '../services/asset';

import AssetSchemas from './schemas/asset.json';

const validateUploadAssets = Validator(AssetSchemas.uploadAssets);
const validateCreateDirectory = Validator(AssetSchemas.createDirectory);
const validateUpdateDirectory = Validator(AssetSchemas.updateDirectory);

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

// get all assets of a user
assetController.get('/users/:userId/assets', async (req: Request, res: Response): Promise<void> => {
    try {
        const { params, query } = req;
        const { userId } = params;
        const { type, include } = query;
        await getUser(userId);
        controlSelf(req, userId);
        const assets = await Prisma.asset.findMany({
            where: {
                userId,
                ...(type ? {
                    type: String(type)
                } : {})
            },
            include: {
                directory: include === 'true'
            }
        });
        res.json({ assets });
    } catch (err: any) {
        res.error(err);
    }
});

// upload an asset for a user
// this endpoint expect multipart/form-data
assetController.post('/users/:userId/assets', async (req: Request, res: Response): Promise<void> => {
    try {
        // control userId
        const { userId } = req.params;
        await getUser(userId);
        controlSelf(req, userId);
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
                const directoryId = fields.directoryId ? String(fields.directoryId) : null;
                if (directoryId !== null) {
                    await getDirectory(userId, directoryId);
                }
                // get files data
                const assetFiles = (
                    Array.isArray(files.assets) ? files.assets : [files.assets]
                );
                const typedAssetFiles: TypedFile[] = (
                    assetFiles.map((file) => ({
                        ...file,
                        type: controlFile(file)
                    }))
                );
                // move temporary files to user's directory
                await Promise.all(
                    typedAssetFiles.map(({
                        filepath: temporaryPath,
                        newFilename
                    }) => (
                        Fs.promises.rename(
                            temporaryPath,
                            Path.join(userDir, newFilename)
                        )
                    ))
                );
                // save assets in database
                const assets = await Prisma.$transaction(
                    typedAssetFiles.map(({
                        originalFilename,
                        newFilename,
                        type
                    }) => {
                        const name = originalFilename ?? newFilename;
                        const path = Path.join(userId, newFilename);
                        return Prisma.asset.create({
                            data: {
                                userId,
                                directoryId,
                                type,
                                name,
                                path
                            }
                        });
                    })
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
});

// get a user's asset
assetController.get('/users/:userId/assets/:assetId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { params } = req;
        const { userId, assetId } = params;
        await getUser(userId);
        controlSelf(req, userId);
        const asset = await getAsset(userId, assetId);
        res.json(asset);
    } catch (err: any) {
        res.error(err);
    }
});

// delete a user's asset
assetController.delete('/users/:userId/assets/:assetId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { params } = req;
        const { userId, assetId } = params;
        await getUser(userId);
        controlSelf(req, userId);
        const { path } = await getAsset(userId, assetId);
        await Promise.all([
            Prisma.asset.delete({
                where: {
                    id: assetId
                }
            }),
            Fs.promises.rm(
                Path.join(assetDir, path)
            )
        ]);
        res.send({});
    } catch (err: any) {
        res.error(err);
    }
});

// get all directories of a user
assetController.get('/users/:userId/directories', async (req: Request, res: Response): Promise<void> => {
    try {
        const { params } = req;
        const { userId } = params;
        await getUser(userId);
        controlSelf(req, userId);
        const directories = await getDirectories(userId);
        res.json({ directories });
    } catch (err: any) {
        res.error(err);
    }
});

// create directory for a user
assetController.post('/users/:userId/directories', async (req: Request, res: Response): Promise<void> => {
    try {
        const { params } = req;
        const { userId } = params;
        await getUser(userId);
        controlSelf(req, userId);
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
});

// get a user's directory
assetController.get('/users/:userId/directories/:directoryId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { params } = req;
        const { userId, directoryId } = params;
        await getUser(userId);
        controlSelf(req, userId);
        const directory = await getDirectory(userId, directoryId);
        res.json(directory);
    } catch (err: any) {
        res.error(err);
    }
});

// update a user's directory
assetController.post('/users/:userId/directories/:directoryId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { params } = req;
        const { userId, directoryId } = params;
        await getUser(userId);
        controlSelf(req, userId);
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
});

// delete a user's directory
assetController.delete('/users/:userId/directories/:directoryId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { params } = req;
        const { userId, directoryId } = params;
        await getUser(userId);
        controlSelf(req, userId);
        await getDirectory(userId, directoryId);
        // get all directories
        const directories = await getDirectories(userId);
        // get all children directories
        const childrenDirectories = getChildrenDirectories(directoryId, directories);
        const childrenDirectoryIds = childrenDirectories.map(({ id }) => id);
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
                assets.map(({ id }) => (
                    Prisma.asset.delete({
                        where: { id }
                    })
                ))
            ),
            ...assets.map(({ path }) => (
                Fs.promises.rm(
                    Path.join(assetDir, path)
                )
            ))
        ]);
        // delete directory and all children directories
        await Prisma.$transaction(
            [directoryId, ...childrenDirectoryIds].map((id) => (
                Prisma.directory.delete({
                    where: { id }
                })
            ))
        );
        res.send({});
    } catch (err: any) {
        res.error(err);
    }
});

export default assetController;
