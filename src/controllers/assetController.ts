import Fs from 'fs';
import Path from 'path';
import {
    Router,
    Request,
    Response
} from 'express';
import { Asset } from '@prisma/client';
import Formidable from 'formidable';

import { getUser } from './userController';
import { controlSelf } from './authController';
import { Prisma, handleNotFound } from '../services/prisma';
import { InternError, ValidationError } from '../services/errors';
import Log from '../services/log';
import { mimeTypes, FileType, MimeType } from '../types/asset';

interface TypedFile extends Formidable.File {
    type: FileType;
}

/* There's a bug in formidable@v2 where maxFileSize option is applied to
all files and not each file so we have to control each file size ourself */
const maxEachFileSizeInMb = 20;
const maxEachFileSize = maxEachFileSizeInMb * 1024 * 1024;

// controls form's file mimetype extension, and size
// returns file type (image or audio)
const controlFile = (file: Formidable.File): FileType => {
    const { mimetype, originalFilename } = file;
    const ext = originalFilename?.split('.').pop() ?? '';
    if (file.size <= maxEachFileSize) {
        if (mimetype) {
            if (mimeTypes[mimetype as MimeType]) {
                const { extensions, type } = mimeTypes[mimetype as MimeType];
                if (extensions.includes(ext)) {
                    return type as FileType;
                }
                throw new ValidationError(
                    `Extension of file ${originalFilename} ${ext} does not match mimetype ${mimetype}`
                );
            }
            throw new ValidationError(`Mimetype of file ${originalFilename} ${mimetype} is not allowed`);
        }
        throw new ValidationError(`Could not get mimetype of file ${originalFilename}`);
    }
    throw new ValidationError(`Size of file ${originalFilename} is to big (max ${maxEachFileSizeInMb}Mb)`);
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
export const assetTempDir = Path.join(assetDir, 'tmp');

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

// formidable initialization options
const formidableOptions: Formidable.Options = {
    uploadDir: assetTempDir,
    keepExtensions: false,
    maxFileSize: 100 * 1024 * 1024,
    multiples: true
};

const getAsset = async (assetId: string): Promise<Asset> => (
    handleNotFound<Asset>(
        'Asset', (
            Prisma.asset.findUnique({
                where: {
                    id: assetId
                }
            })
        )
    )
);

const assetController = Router();

// get all assets of a user
assetController.get('/users/:userId/assets', async (
    { params, query, token }: Request,
    res: Response
): Promise<void> => {
    try {
        const { userId } = params;
        const { type } = query;
        await getUser(userId);
        controlSelf(token, userId);
        const assets = await Prisma.asset.findMany({
            where: {
                userId,
                ...(type ? {
                    type: String(type)
                } : {})
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
        controlSelf(req.token, userId);
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
                if (!files.assets) {
                    throw new ValidationError('Missing assets field in form data');
                }
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
assetController.get('/users/:userId/assets/:assetId', async ({ params, token }: Request, res: Response): Promise<void> => {
    try {
        const { userId, assetId } = params;
        await getUser(userId);
        controlSelf(token, userId);
        const asset = await getAsset(assetId);
        res.json(asset);
    } catch (err: any) {
        res.error(err);
    }
});

// delete a user's asset
assetController.delete('/users/:userId/assets/:assetId', async ({ params, token }: Request, res: Response): Promise<void> => {
    try {
        const { userId, assetId } = params;
        await getUser(userId);
        controlSelf(token, userId);
        const { path } = await getAsset(assetId);
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

export default assetController;
