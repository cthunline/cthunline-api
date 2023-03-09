import { Router, Request, Response } from 'express';

import { ValidationError } from '../services/errors';
import { isValidGameId } from '../services/games';
import { parseParamId } from '../services/tools';
import Validator from '../services/validator';
import { controlSelf } from './helpers/auth';
import { Prisma } from '../services/prisma';
import { defaultSketchData, getInclude, getSession } from './helpers/session';

import definitions from './schemas/definitions.json';
import sessionSchemas from './schemas/session.json';

const validateCreateSession = Validator({
    ...sessionSchemas.create,
    ...definitions
});
const validateUpdateSession = Validator({
    ...sessionSchemas.update,
    ...definitions
});

const sessionController = Router();

// get all sessions
sessionController.get(
    '/sessions',
    async ({ query }: Request, res: Response): Promise<void> => {
        try {
            const { include } = query;
            const sessions = await Prisma.session.findMany({
                ...getInclude(include === 'true')
            });
            res.json({ sessions });
        } catch (err: any) {
            res.error(err);
        }
    }
);

// create a session
sessionController.post(
    '/sessions',
    async (req: Request, res: Response): Promise<void> => {
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
    }
);

// get a session
sessionController.get(
    '/sessions/:sessionId',
    async ({ params }: Request, res: Response): Promise<void> => {
        try {
            const sessionId = parseParamId(params, 'sessionId');
            const session = await getSession(sessionId);
            res.json(session);
        } catch (err: any) {
            res.error(err);
        }
    }
);

// edit a session
sessionController.post(
    '/sessions/:sessionId',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { body, params } = req;
            const sessionId = parseParamId(params, 'sessionId');
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
    }
);

// delete a session
sessionController.delete(
    '/sessions/:sessionId',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const sessionId = parseParamId(req.params, 'sessionId');
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
    }
);

export default sessionController;
