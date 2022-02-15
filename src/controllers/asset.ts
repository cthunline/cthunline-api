import {
    Router,
    Request,
    Response
} from 'express';
import { Asset } from '@prisma/client';
import Formidable from 'formidable';

import { findUser } from './user';
import { Prisma, handleNotFound } from '../services/prisma';
import { ValidationError } from '../services/errors';

// allowed asset file extensions
// const validExtensions = [
//     'jpg',
//     'jpeg',
//     'png',
//     'svg',
//     'mp3'
// ];

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
            uploadDir: '',
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
            // const file = files.asset;
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
