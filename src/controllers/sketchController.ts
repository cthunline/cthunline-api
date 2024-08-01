import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { parseParamId } from '../services/api.js';
import {
    createSketch,
    deleteSketchById,
    getUserSessionSketchs,
    getUserSketchByIdOrThrow,
    updateSketchById
} from '../services/queries/sketch.js';
import { controlSelf } from './helpers/auth.js';
import { controlSessionGameMaster } from './helpers/session.js';
import {
    type CreateSketchBody,
    type UpdateSketchBody,
    createSketchSchema,
    updateSketchSchema
} from './schemas/sketch.js';

export const sketchController = async (app: FastifyInstance) => {
    // biome-ignore lint/suspicious/useAwait: fastify controllers require async

    // get all sketchs belonging to current user in the given session
    app.route({
        method: 'GET',
        url: '/sessions/:sessionId/sketchs',
        handler: async (
            {
                user,
                params
            }: FastifyRequest<{
                Params: {
                    sessionId: string;
                };
            }>,
            rep: FastifyReply
        ) => {
            const sessionId = parseParamId(params, 'sessionId');
            const session = await controlSessionGameMaster(sessionId, user.id);
            const sketchs = await getUserSessionSketchs(user.id, session.id);
            rep.send({ sketchs });
        }
    });

    // create a sketch for current user and the given session
    app.route({
        method: 'POST',
        url: '/sessions/:sessionId/sketchs',
        schema: { body: createSketchSchema },
        handler: async (
            {
                params,
                body,
                user
            }: FastifyRequest<{
                Params: {
                    sessionId: string;
                };
                Body: CreateSketchBody;
            }>,
            rep: FastifyReply
        ) => {
            const sessionId = parseParamId(params, 'sessionId');
            const session = await controlSessionGameMaster(sessionId, user.id);
            const createdSketch = await createSketch({
                ...body,
                userId: user.id,
                sessionId: session.id
            });
            rep.send(createdSketch);
        }
    });

    // edit a sketch for current user
    app.route({
        method: 'PATCH',
        url: '/sketchs/:sketchId',
        schema: { body: updateSketchSchema },
        handler: async (
            {
                params,
                body,
                user
            }: FastifyRequest<{
                Params: {
                    sketchId: string;
                };
                Body: UpdateSketchBody;
            }>,
            rep: FastifyReply
        ) => {
            const sketchId = parseParamId(params, 'sketchId');
            await getUserSketchByIdOrThrow(user.id, sketchId);
            const updatedSketch = await updateSketchById(sketchId, body);
            rep.send(updatedSketch);
        }
    });

    // get a sketch belonging to current user
    app.route({
        method: 'GET',
        url: '/sketchs/:sketchId',
        handler: async (
            {
                params,
                user
            }: FastifyRequest<{
                Params: {
                    sketchId: string;
                };
            }>,
            rep: FastifyReply
        ) => {
            const sketchId = parseParamId(params, 'sketchId');
            const sketch = await getUserSketchByIdOrThrow(user.id, sketchId);
            rep.send(sketch);
        }
    });

    // delete a sketch belonging to the current user
    app.route({
        method: 'DELETE',
        url: '/sketchs/:sketchId',
        handler: async (
            {
                params,
                user
            }: FastifyRequest<{
                Params: {
                    sketchId: string;
                };
            }>,
            rep: FastifyReply
        ) => {
            const sketchId = parseParamId(params, 'sketchId');
            const sketch = await getUserSketchByIdOrThrow(user.id, sketchId);
            controlSelf(sketch.userId, user);
            await deleteSketchById(sketchId);
            rep.send({});
        }
    });
};
