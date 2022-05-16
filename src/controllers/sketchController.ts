import {
    Router,
    Request,
    Response
} from 'express';
import { Sketch } from '@prisma/client';

import { Prisma, handleNotFound } from '../services/prisma';
import Validator from '../services/validator';

import definitions from './schemas/definitions.json';
import sketchSchemas from './schemas/sketch.json';

const validateCreateSketch = Validator({
    ...sketchSchemas.create,
    ...definitions
});

const sketchController = Router();

// get all sketchs belonging to current user
sketchController.get('/sketchs', async ({ user }: Request, res: Response): Promise<void> => {
    try {
        const userId = user.id;
        const sketchs = await Prisma.sketch.findMany({
            where: {
                userId
            }
        });
        res.json({ sketchs });
    } catch (err: any) {
        res.error(err);
    }
});

// save a sketch for current user
sketchController.post('/sketchs', async (req: Request, res: Response): Promise<void> => {
    try {
        const { body, user } = req;
        validateCreateSketch(body);
        const sketch = await Prisma.sketch.create({
            data: {
                ...body,
                userId: user.id
            }
        });
        res.json(sketch);
    } catch (err: any) {
        res.error(err);
    }
});

// get a sketch belonging to current user
sketchController.get('/sketchs/:sketchId', async ({ params, user }: Request, res: Response): Promise<void> => {
    try {
        const sketchId = Number(params.sketchId);
        const sketch = await handleNotFound<Sketch>(
            'Sketch', (
                Prisma.sketch.findFirst({
                    where: {
                        id: sketchId,
                        userId: user.id
                    }
                })
            )
        );
        res.json(sketch);
    } catch (err: any) {
        res.error(err);
    }
});

// delete a sketch belonging to the current user
sketchController.delete('/sketchs/:sketchId', async ({ params, user }: Request, res: Response): Promise<void> => {
    try {
        const sketchId = Number(params.sketchId);
        await handleNotFound<Sketch>(
            'Sketch', (
                Prisma.sketch.findFirst({
                    where: {
                        id: sketchId,
                        userId: user.id
                    }
                })
            )
        );
        await Prisma.sketch.delete({
            where: {
                id: sketchId
            }
        });
        res.send({});
    } catch (err: any) {
        res.error(err);
    }
});

export default sketchController;
