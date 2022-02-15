import {
    Router,
    Request,
    Response
} from 'express';
import { Session } from '@prisma/client';

import {
    Prisma,
    handleNotFound
} from '../services/prisma';
import Validator from '../services/validator';

import SessionSchemas from './schemas/session.json';

const validateCreate = Validator(SessionSchemas.create);
const validateUpdate = Validator(SessionSchemas.update);

const sessionRouter = Router();

// get all sessions
sessionRouter.get('/sessions', async (req: Request, res: Response): Promise<void> => {
    try {
        const sessions = await Prisma.session.findMany();
        res.json({ sessions });
    } catch (err: any) {
        res.error(err);
    }
});

// create a session
sessionRouter.post('/sessions', async (req: Request, res: Response): Promise<void> => {
    try {
        const createData = req.body;
        validateCreate(createData);
        if (!createData.sketch) {
            createData.sketch = {};
        }
        const session = await Prisma.session.create({
            data: {
                ...createData,
                masterId: req.token.userId
            }
        });
        res.json(session);
    } catch (err: any) {
        res.error(err);
    }
});

// get a session
sessionRouter.get('/sessions/:sessionId', async ({ params }: Request, res: Response): Promise<void> => {
    try {
        const { sessionId } = params;
        const session = await handleNotFound<Session>(
            'Session', (
                Prisma.session.findUnique({
                    where: {
                        id: sessionId
                    }
                })
            )
        );
        res.json(session);
    } catch (err: any) {
        res.error(err);
    }
});

// edit a session
sessionRouter.post('/sessions/:sessionId', async ({ params, body }: Request, res: Response): Promise<void> => {
    try {
        const { sessionId } = params;
        const session = await handleNotFound<Session>(
            'Session', (
                Prisma.session.findUnique({
                    where: {
                        id: sessionId
                    }
                })
            )
        );
        validateUpdate(body);
        const updatedSession = await Prisma.session.update({
            data: body,
            where: {
                id: session.id
            }
        });
        res.json(updatedSession);
    } catch (err: any) {
        res.error(err);
    }
});

// delete a session
sessionRouter.delete('/sessions/:sessionId', async ({ params }: Request, res: Response): Promise<void> => {
    try {
        const { sessionId } = params;
        await handleNotFound<Session>(
            'Session', (
                Prisma.session.findUnique({
                    where: {
                        id: sessionId
                    }
                })
            )
        );
        await Prisma.session.delete({
            where: {
                id: sessionId
            }
        });
        res.send({});
    } catch (err: any) {
        res.error(err);
    }
});

export default sessionRouter;
