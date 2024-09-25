import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { ValidationError } from '../services/errors.js';
import { isValidGameId } from '../services/games.js';
import { deleteSessionNotes } from '../services/queries/note.js';
import {
    createSession,
    deleteSessionById,
    getSessionByIdOrThrow,
    getSessions,
    updateSessionById
} from '../services/queries/session.js';
import { controlSelf } from './helpers/auth.js';
import { defaultSketchData } from './helpers/sketch.js';
import { type SessionIdParams, sessionIdSchema } from './schemas/params.js';
import {
    type CreateSessionBody,
    type UpdateSessionBody,
    createSessionSchema,
    updateSessionSchema
} from './schemas/session.js';

export const sessionController = async (app: FastifyInstance) => {
    // biome-ignore lint/suspicious/useAwait: fastify controllers require async

    // get all sessions
    app.route({
        method: 'GET',
        url: '/sessions',
        handler: async (
            _req: FastifyRequest<{
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
        schema: {
            params: sessionIdSchema
        },
        handler: async (
            {
                params: { sessionId }
            }: FastifyRequest<{
                Params: SessionIdParams;
            }>,
            rep: FastifyReply
        ) => {
            const session = await getSessionByIdOrThrow(sessionId);
            rep.send(session);
        }
    });

    // edit a session
    app.route({
        method: 'PATCH',
        url: '/sessions/:sessionId',
        schema: {
            params: sessionIdSchema,
            body: updateSessionSchema
        },
        handler: async (
            {
                body,
                params: { sessionId },
                user
            }: FastifyRequest<{
                Params: SessionIdParams;
                Body: UpdateSessionBody;
            }>,
            rep: FastifyReply
        ) => {
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
        schema: {
            params: sessionIdSchema
        },
        handler: async (
            {
                params: { sessionId },
                user
            }: FastifyRequest<{
                Params: SessionIdParams;
            }>,
            rep: FastifyReply
        ) => {
            const session = await getSessionByIdOrThrow(sessionId);
            controlSelf(session.masterId, user);
            await deleteSessionNotes(sessionId);
            await deleteSessionById(sessionId);
            rep.send({});
        }
    });
};
