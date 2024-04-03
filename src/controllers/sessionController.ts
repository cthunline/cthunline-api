import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { defaultSketchData } from './helpers/sketch.js';
import { ValidationError } from '../services/errors.js';
import { isValidGameId } from '../services/games.js';
import { parseParamId } from '../services/api.js';
import { controlSelf } from './helpers/auth.js';
import {
    createSessionSchema,
    type CreateSessionBody,
    updateSessionSchema,
    type UpdateSessionBody
} from './schemas/session.js';
import {
    createSession,
    deleteSessionById,
    getSessionByIdOrThrow,
    getSessions,
    updateSessionById
} from '../services/queries/session.js';

export const sessionController = async (app: FastifyInstance) => {
    // get all sessions
    app.route({
        method: 'GET',
        url: '/sessions',
        handler: async (
            req: FastifyRequest<{
                Params: {
                    sessionId: string;
                };
            }>,
            rep: FastifyReply
        ) => {
            const sessions = await getSessions();
            rep.send({ sessions });
        }
    });

    // create a session
    app.route({
        method: 'POST',
        url: '/sessions',
        schema: { body: createSessionSchema },
        handler: async (
            {
                body,
                user
            }: FastifyRequest<{
                Body: CreateSessionBody;
            }>,
            rep: FastifyReply
        ) => {
            const { gameId, sketch } = body;
            if (!isValidGameId(gameId)) {
                throw new ValidationError(`Invalid gameId ${gameId}`);
            }
            const createdSession = await createSession({
                ...body,
                sketch: sketch ?? defaultSketchData,
                masterId: user.id
            });
            rep.send(createdSession);
        }
    });

    // get a session
    app.route({
        method: 'GET',
        url: '/sessions/:sessionId',
        handler: async (
            {
                params
            }: FastifyRequest<{
                Params: {
                    sessionId: string;
                };
            }>,
            rep: FastifyReply
        ) => {
            const sessionId = parseParamId(params, 'sessionId');
            const session = await getSessionByIdOrThrow(sessionId);
            rep.send(session);
        }
    });

    // edit a session
    app.route({
        method: 'POST',
        url: '/sessions/:sessionId',
        schema: { body: updateSessionSchema },
        handler: async (
            {
                body,
                params,
                user
            }: FastifyRequest<{
                Params: {
                    sessionId: string;
                };
                Body: UpdateSessionBody;
            }>,
            rep: FastifyReply
        ) => {
            const sessionId = parseParamId(params, 'sessionId');
            const session = await getSessionByIdOrThrow(sessionId);
            controlSelf(session.masterId, user);
            const updatedSession = await updateSessionById(session.id, body);
            rep.send(updatedSession);
        }
    });

    // delete a session
    app.route({
        method: 'DELETE',
        url: '/sessions/:sessionId',
        handler: async (
            {
                params,
                user
            }: FastifyRequest<{
                Params: {
                    sessionId: string;
                };
            }>,
            rep: FastifyReply
        ) => {
            const sessionId = parseParamId(params, 'sessionId');
            const session = await getSessionByIdOrThrow(sessionId);
            controlSelf(session.masterId, user);
            await deleteSessionById(sessionId);
            rep.send({});
        }
    });
};
