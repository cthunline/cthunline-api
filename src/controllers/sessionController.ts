import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, getTableColumns } from 'drizzle-orm';

import { InternError, ValidationError } from '../services/errors.js';
import { getSessionOrThrow } from './helpers/session.js';
import { defaultSketchData } from './helpers/sketch.js';
import { isValidGameId } from '../services/games.js';
import { safeUserSelect } from './helpers/user.js';
import { parseParamId } from '../services/api.js';
import { controlSelf } from './helpers/auth.js';
import { db, tables } from '../services/db.js';
import {
    createSessionSchema,
    type CreateSessionBody,
    updateSessionSchema,
    type UpdateSessionBody
} from './schemas/session.js';

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
            const sessions = await db
                .select({
                    ...getTableColumns(tables.sessions),
                    master: safeUserSelect
                })
                .from(tables.sessions)
                .innerJoin(
                    tables.users,
                    eq(tables.sessions.masterId, tables.users.id)
                );
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
            const createdSessions = await db
                .insert(tables.sessions)
                .values({
                    ...body,
                    sketch: sketch ?? defaultSketchData,
                    masterId: user.id
                })
                .returning();
            const createdSession = createdSessions[0];
            if (!createdSession) {
                throw new InternError('Could not retreive inserted session');
            }
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
            const session = await getSessionOrThrow(sessionId);
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
            const session = await getSessionOrThrow(sessionId);
            controlSelf(session.masterId, user);
            const updatedSessions = await db
                .update(tables.sessions)
                .set(body)
                .where(eq(tables.sessions.id, session.id))
                .returning();
            const updatedSession = updatedSessions[0];
            if (!updatedSession) {
                throw new InternError('Could not retreive updated session');
            }
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
            const session = await getSessionOrThrow(sessionId);
            controlSelf(session.masterId, user);
            await db
                .delete(tables.sessions)
                .where(eq(tables.sessions.id, sessionId));
            rep.send({});
        }
    });
};
