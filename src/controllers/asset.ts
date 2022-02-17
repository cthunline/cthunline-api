import Fs from 'fs';
import Path from 'path';
import {
    Router,
    Request,
    Response
} from 'express';
import { Asset } from '@prisma/client';
import Formidable from 'formidable';

import { findUser } from './user';
import { Prisma, handleNotFound } from '../services/prisma';
import { InternError, ValidationError } from '../services/errors';
import { mimeTypes, FileType, MimeType } from '../types/asset';

// formidable initialization options
const formidableOptions = {
    keepExtensions: true,
    maxFileSize: 20 * 1024 * 1024
};

// check asset directory exists and is writable
const getAssetDir = (): string => {
    const dir = process.env.ASSET_DIR;
    if (dir) {
        try {
            Fs.accessSync(dir, Fs.constants.F_OK);
            Fs.accessSync(dir, Fs.constants.W_OK);
            return dir;
        } catch {
            throw new InternError(`Asset directory ${dir} does not exist or is not writable`);
        }
    } else {
        throw new InternError('No asset directory provided');
    }
};

export const assetDir = getAssetDir();

// controls form's file mimetype and extension
// returns file type (image or audio)
const controlFileType = (file: Formidable.File): FileType => {
    const { mimetype, originalFilename } = file;
    const ext = originalFilename?.split('.').pop() ?? '';
    if (mimetype) {
        if (mimeTypes[mimetype as MimeType]) {
            const { extensions, type } = mimeTypes[mimetype as MimeType];
            if (extensions.includes(ext)) {
                return type as FileType;
            }
            throw new ValidationError(`File extension ${ext} does not match mimetype ${mimetype}`);
        }
        throw new ValidationError(`File mimetype ${mimetype} is not allowed`);
    }
    throw new ValidationError('Could not get file mimetype');
};

// create user subdirectory in asset dir if not exist and return its path
const controlUserDir = async (userId: string): Promise<string> => {
    const userDir = Path.join(assetDir, userId);
    try {
        await Fs.promises.access(userDir, Fs.constants.F_OK);
    } catch {
        await Fs.promises.mkdir(userDir);
    }
    return userDir;
};

const assetRouter = Router();

// get all assets of a user
assetRouter.get('/users/:userId/assets', async ({ params }: Request, res: Response): Promise<void> => {
    try {
        const { userId } = params;
        await findUser(userId);
        const assets = await Prisma.asset.findMany({
            where: {
                userId
            }
        });
        res.json({ assets });
    } catch (err: any) {
        res.error(err);
    }
});

// upload an asset for a user
// this endpoint expect multipart/form-data
assetRouter.post('/users/:userId/assets', async (req: Request, res: Response): Promise<void> => {
    try {
        // control userId
        const { userId } = req.params;
        await findUser(userId);
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
                if (!files.asset) {
                    throw new ValidationError('Missing asset field in form data');
                }
                const file = files.asset as Formidable.File;
                const type = controlFileType(file);
                // build target upload file path
                const {
                    filepath: temporaryPath,
                    originalFilename,
                    newFilename
                } = file;
                const name = originalFilename ?? newFilename;
                const path = Path.join(userId, newFilename);
                const uploadPath = Path.join(userDir, newFilename);
                // move temporary file to new file
                await Fs.promises.rename(
                    temporaryPath,
                    uploadPath
                );
                // create asset database object
                const asset = await Prisma.asset.create({
                    data: {
                        userId,
                        type,
                        name,
                        path
                    }
                });
                //
                res.json(asset);
            } catch (formErr: any) {
                res.error(formErr);
            }
        });
    } catch (err: any) {
        res.error(err);
    }
});

// get a user's asset
assetRouter.get('/users/:userId/assets/:assetId', async ({ params }: Request, res: Response): Promise<void> => {
    try {
        const { userId, assetId } = params;
        await findUser(userId);
        const asset = await handleNotFound<Asset>(
            'Asset', (
                Prisma.asset.findUnique({
                    where: {
                        id: assetId
                    }
                })
            )
        );
        res.json(asset);
    } catch (err: any) {
        res.error(err);
    }
});

// delete a user's asset
assetRouter.delete('/users/:userId/assets/:assetId', async ({ params }: Request, res: Response): Promise<void> => {
    try {
        const { userId, assetId } = params;
        await findUser(userId);
        const { path } = await handleNotFound<Asset>(
            'Asset', (
                Prisma.asset.findUnique({
                    where: {
                        id: assetId
                    }
                })
            )
        );
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

export default assetRouter;
