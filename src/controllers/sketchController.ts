import {
    Router,
    Request,
    Response
} from 'express';

import { Prisma } from '../services/prisma';
import Validator from '../services/validator';
import { controlSelf } from './helpers/auth';

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
        const sketch = await Prisma.sketch.findFirstOrThrow({
            where: {
                id: sketchId,
                userId: user.id
            }
        });
        res.json(sketch);
    } catch (err: any) {
        res.error(err);
    }
});

// delete a sketch belonging to the current user
sketchController.delete('/sketchs/:sketchId', async (req: Request, res: Response): Promise<void> => {
    try {
        const sketchId = Number(req.params.sketchId);
        const sketch = await Prisma.sketch.findFirstOrThrow({
            where: {
                id: sketchId
            }
        });
        controlSelf(req, sketch.userId);
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
