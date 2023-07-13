import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { ValidationError } from '../services/errors';
import { isValidGameId } from '../services/games';
import { parseParamId } from '../services/api';
import { Prisma } from '../services/prisma';

import { defaultSketchData, getInclude, getSession } from './helpers/session';
import { controlSelf } from './helpers/auth';

import { QueryParam } from '../types/api';

import {
    createSessionSchema,
    CreateSessionBody,
    updateSessionSchema,
    UpdateSessionBody
} from './schemas/session';

const sessionController = async (app: FastifyInstance) => {
    // get all sessions
    app.route({
        method: 'GET',
        url: '/sessions',
        handler: async (
            {
                query
            }: FastifyRequest<{
                Params: {
                    sessionId: string;
                };
                Querystring: {
                    include?: QueryParam;
                };
            }>,
            rep: FastifyReply
        ) => {
            const { include } = query;
            const sessions = await Prisma.session.findMany({
                ...getInclude(include === 'true')
            });
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
            const session = await Prisma.session.create({
                data: {
                    ...body,
                    sketch: sketch ?? defaultSketchData,
                    masterId: user.id
                }
            });
            rep.send(session);
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
            const session = await getSession(sessionId);
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
            const session = await getSession(sessionId);
            controlSelf(session.masterId, user);
            const updatedSession = await Prisma.session.update({
                data: body,
                where: {
                    id: session.id
                }
            });
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
            const session = await getSession(sessionId);
            controlSelf(session.masterId, user);
            await Prisma.session.delete({
                where: {
                    id: sessionId
                }
            });
            rep.send({});
        }
    });
};

export default sessionController;
