import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { parseParamId } from '../services/api.js';
import { controlSelf } from './helpers/auth.js';
import {
    createSketchSchema,
    type CreateSketchBody,
    updateSketchSchema,
    type UpdateSketchBody
} from './schemas/sketch.js';
import {
    createSketch,
    deleteSketchById,
    getUserSketchByIdOrThrow,
    getUserSketchs,
    updateSketchById
} from '../services/queries/sketch.js';

export const sketchController = async (app: FastifyInstance) => {
    // get all sketchs belonging to current user
    app.route({
        method: 'GET',
        url: '/sketchs',
        handler: async ({ user }: FastifyRequest, rep: FastifyReply) => {
            const userId = user.id;
            const sketchs = await getUserSketchs(userId);
            rep.send({ sketchs });
        }
    });

    // save a sketch for current user
    app.route({
        method: 'POST',
        url: '/sketchs',
        schema: { body: createSketchSchema },
        handler: async (
            {
                body,
                user
            }: FastifyRequest<{
                Body: CreateSketchBody;
            }>,
            rep: FastifyReply
        ) => {
            const createdSketch = await createSketch({
                ...body,
                userId: user.id
            });
            rep.send(createdSketch);
        }
    });

    // save a sketch for current user
    app.route({
        method: 'POST',
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
