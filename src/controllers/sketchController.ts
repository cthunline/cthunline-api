import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

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
    type SessionIdParam,
    type SketchIdParam,
    sessionIdParamSchema,
    sketchIdParamSchema
} from './schemas/params.js';
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
        schema: {
            params: sessionIdParamSchema
        },
        handler: async (
            {
                user,
                params: { sessionId }
            }: FastifyRequest<{
                Params: SessionIdParam;
            }>,
            rep: FastifyReply
        ) => {
            const session = await controlSessionGameMaster(sessionId, user.id);
            const sketchs = await getUserSessionSketchs(user.id, session.id);
            rep.send({ sketchs });
        }
    });

    // create a sketch for current user and the given session
    app.route({
        method: 'POST',
        url: '/sessions/:sessionId/sketchs',
        schema: {
            params: sessionIdParamSchema,
            body: createSketchSchema
        },
        handler: async (
            {
                params: { sessionId },
                body,
                user
            }: FastifyRequest<{
                Params: SessionIdParam;
                Body: CreateSketchBody;
            }>,
            rep: FastifyReply
        ) => {
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
        schema: {
            params: sketchIdParamSchema,
            body: updateSketchSchema
        },
        handler: async (
            {
                params: { sketchId },
                body,
                user
            }: FastifyRequest<{
                Params: SketchIdParam;
                Body: UpdateSketchBody;
            }>,
            rep: FastifyReply
        ) => {
            await getUserSketchByIdOrThrow(user.id, sketchId);
            const updatedSketch = await updateSketchById(sketchId, body);
            rep.send(updatedSketch);
        }
    });

    // get a sketch belonging to current user
    app.route({
        method: 'GET',
        url: '/sketchs/:sketchId',
        schema: {
            params: sketchIdParamSchema
        },
        handler: async (
            {
                params: { sketchId },
                user
            }: FastifyRequest<{
                Params: SketchIdParam;
            }>,
            rep: FastifyReply
        ) => {
            const sketch = await getUserSketchByIdOrThrow(user.id, sketchId);
            rep.send(sketch);
        }
    });

    // delete a sketch belonging to the current user
    app.route({
        method: 'DELETE',
        url: '/sketchs/:sketchId',
        schema: {
            params: sketchIdParamSchema
        },
        handler: async (
            {
                params: { sketchId },
                user
            }: FastifyRequest<{
                Params: SketchIdParam;
            }>,
            rep: FastifyReply
        ) => {
            const sketch = await getUserSketchByIdOrThrow(user.id, sketchId);
            controlSelf(sketch.userId, user);
            await deleteSketchById(sketchId);
            rep.send({});
        }
    });
};
