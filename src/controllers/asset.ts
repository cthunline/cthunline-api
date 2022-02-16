import Fs from 'fs';
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

// check asset directory exists and is writable
const assetDir = process.env.ASSET_DIR;
if (assetDir) {
    try {
        Fs.accessSync(assetDir, Fs.constants.F_OK);
        Fs.accessSync(assetDir, Fs.constants.W_OK);
    } catch (err) {
        throw new InternError(`Asset directory ${assetDir} does not exist or is not writable`);
    }
} else {
    throw new InternError('No asset directory provided');
}

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
        // initialize formidable
        const form = Formidable({
            uploadDir: assetDir,
            keepExtensions: true,
            maxFileSize: 20 * 1024 * 1024
        });
        // parse form data
        form.parse(req, async (err, fields, files) => {
            // file controls
            if (err) {
                throw new ValidationError('Error while parsing file');
            }
            if (!files.asset) {
                throw new ValidationError('Missing asset field in form data');
            }
            // const {
            //     filePath,
            //     newFilename,
            //     originalFilename,
            //     mimetype
            // } = files.asset;
            const file = files.asset as Formidable.File;
            controlFileType(file);
            //
            /*
            filepath: '/tmp/ead03a4cf12edb253e0dc4700.png',
            newFilename: 'ead03a4cf12edb253e0dc4700.png',
            originalFilename: 'cthulhu.png',
            mimetype: 'image/png',
            */
            // const ext = file.type.split('/').pop();
            // if (!validExtensions.includes(ext)) {
            //     throw new ValidationError('Invalid file type');
            // }
            // TODO write file on disk
            // const asset = await Prisma.asset.create({
            //     data: {
            //         type: '',
            //         filename: ''
            //     }
            // });
            // res.json(asset);
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
        await handleNotFound<Asset>(
            'Asset', (
                Prisma.asset.findUnique({
                    where: {
                        id: assetId
                    }
                })
            )
        );
        // TODO delete file on disk
        await Prisma.asset.delete({
            where: {
                id: assetId
            }
        });
        res.send({});
    } catch (err: any) {
        res.error(err);
    }
});

export default assetRouter;
