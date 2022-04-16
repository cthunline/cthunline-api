import {
    Router,
    Request,
    Response
} from 'express';

import { Prisma } from '../services/prisma';
import { controlSelf } from '../services/auth';
import Validator from '../services/validator';
import { isValidGameId } from '../games';
import { ValidationError } from '../services/errors';
import {
    defaultSketchData,
    getInclude,
    getSession,
    getNotes,
    buildSessionSchema
} from '../services/session';

import SessionSchemas from './schemas/session.json';

const validateCreateSession = Validator(
    buildSessionSchema(SessionSchemas.create, SessionSchemas)
);
const validateUpdateSession = Validator(
    buildSessionSchema(SessionSchemas.update, SessionSchemas)
);
const validateNotes = Validator(SessionSchemas.notes);

const sessionController = Router();

// get all sessions
sessionController.get('/sessions', async ({ query }: Request, res: Response): Promise<void> => {
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
sessionController.post('/sessions', async (req: Request, res: Response): Promise<void> => {
    try {
        const createData = req.body;
        const { gameId, sketch } = createData;
        validateCreateSession(createData);
        if (!isValidGameId(gameId)) {
            throw new ValidationError(`Invalid gameId ${gameId}`);
        }
        if (!sketch) {
            createData.sketch = defaultSketchData;
        }
        const session = await Prisma.session.create({
            data: {
                ...createData,
                masterId: req.user.id
            }
        });
        res.json(session);
    } catch (err: any) {
        res.error(err);
    }
});

// get a session
sessionController.get('/sessions/:sessionId', async ({ params }: Request, res: Response): Promise<void> => {
    try {
        const { sessionId } = params;
        const session = await getSession(sessionId);
        res.json(session);
    } catch (err: any) {
        res.error(err);
    }
});

// edit a session
sessionController.post('/sessions/:sessionId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { body, params } = req;
        const { sessionId } = params;
        const session = await getSession(sessionId);
        controlSelf(req, session.masterId);
        validateUpdateSession(body);
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
sessionController.delete('/sessions/:sessionId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { params } = req;
        const { sessionId } = params;
        const session = await getSession(sessionId);
        controlSelf(req, session.masterId);
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

// get current user notes in a session
sessionController.get('/sessions/:sessionId/notes', async ({ params, user }: Request, res: Response): Promise<void> => {
    try {
        const { sessionId } = params;
        await getSession(sessionId);
        const notes = await getNotes(sessionId, user.id);
        res.json(notes);
    } catch (err: any) {
        res.error(err);
    }
});

// set current user notes in a session
sessionController.post('/sessions/:sessionId/notes', async ({ body, params, user }: Request, res: Response): Promise<void> => {
    try {
        const { sessionId } = params;
        await getSession(sessionId);
        validateNotes(body);
        const notes = await getNotes(sessionId, user.id);
        const updatedNotes = await Prisma.note.update({
            data: body,
            where: {
                id: notes.id
            }
        });
        res.json(updatedNotes);
    } catch (err: any) {
        res.error(err);
    }
});

export default sessionController;
