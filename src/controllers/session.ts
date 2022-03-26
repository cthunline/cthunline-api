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
import { controlSelf } from './auth';
import Validator from '../services/validator';
import { isValidGameId } from '../games';
import { ValidationError } from '../services/errors';
import { userSelect } from './user';

import SessionSchemas from './schemas/session.json';

const buildSessionSchema = (baseSchema: any) => ({
    definitions: SessionSchemas.definitions,
    ...baseSchema,
    properties: {
        ...baseSchema.properties,
        sketch: SessionSchemas.sketch
    }
});

const validateCreate = Validator(
    buildSessionSchema(SessionSchemas.create)
);
const validateUpdate = Validator(
    buildSessionSchema(SessionSchemas.update)
);

const defaultSketchData = {
    displayed: false,
    paths: [],
    images: [],
    events: []
};

const getInclude = (includeMaster: boolean) => (
    includeMaster ? {
        include: {
            master: {
                select: userSelect
            }
        }
    } : undefined
);

const sessionRouter = Router();

// get all sessions
sessionRouter.get('/sessions', async ({ query }: Request, res: Response): Promise<void> => {
    try {
        const { include } = query;
        const sessions = await Prisma.session.findMany({
            ...getInclude(include === 'true')
        });
        res.json({ sessions });
    } catch (err: any) {
        res.error(err);
    }
});

// create a session
sessionRouter.post('/sessions', async (req: Request, res: Response): Promise<void> => {
    try {
        const createData = req.body;
        const { gameId, sketch } = createData;
        validateCreate(createData);
        if (!isValidGameId(gameId)) {
            throw new ValidationError(`Invalid gameId ${gameId}`);
        }
        if (!sketch) {
            createData.sketch = defaultSketchData;
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
sessionRouter.post('/sessions/:sessionId', async ({ params, body, token }: Request, res: Response): Promise<void> => {
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
        controlSelf(token, session.masterId);
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
sessionRouter.delete('/sessions/:sessionId', async ({ params, token }: Request, res: Response): Promise<void> => {
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
        controlSelf(token, session.masterId);
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
