import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

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
import { sessionIdParamSchema } from './schemas/params.js';
import { createSessionSchema, updateSessionSchema } from './schemas/session.js';

export const sessionController: FastifyPluginAsyncTypebox = async (app) => {
    // biome-ignore lint/suspicious/useAwait: fastify controllers require async

    // get all sessions
    app.route({
        method: 'GET',
        url: '/sessions',
        handler: async (_req, rep) => {
            const sessions = await getSessions();
            rep.send({ sessions });
        }
    });

    // create a session
    app.route({
        method: 'POST',
        url: '/sessions',
        schema: { body: createSessionSchema },
        handler: async ({ body, user }, rep) => {
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
            params: sessionIdParamSchema
        },
        handler: async ({ params: { sessionId } }, rep) => {
            const session = await getSessionByIdOrThrow(sessionId);
            rep.send(session);
        }
    });

    // edit a session
    app.route({
        method: 'PATCH',
        url: '/sessions/:sessionId',
        schema: {
            params: sessionIdParamSchema,
            body: updateSessionSchema
        },
        handler: async ({ body, params: { sessionId }, user }, rep) => {
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
            params: sessionIdParamSchema
        },
        handler: async ({ params: { sessionId }, user }, rep) => {
            const session = await getSessionByIdOrThrow(sessionId);
            controlSelf(session.masterId, user);
            await deleteSessionNotes(sessionId);
            await deleteSessionById(sessionId);
            rep.send({});
        }
    });
};
