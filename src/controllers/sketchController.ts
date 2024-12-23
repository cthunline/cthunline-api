import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import {
    createSketch,
    deleteSketchById,
    getUserSessionSketchs,
    getUserSketchByIdOrThrow,
    updateSketchById
} from '../services/queries/sketch.js';
import { controlSelf } from './helpers/auth.js';
import { controlSessionGameMaster } from './helpers/session.js';
import { sessionIdParamSchema, sketchIdParamSchema } from './schemas/params.js';
import { createSketchSchema, updateSketchSchema } from './schemas/sketch.js';

export const sketchController: FastifyPluginAsyncTypebox = async (app) => {
    // biome-ignore lint/suspicious/useAwait: fastify controllers require async

    // get all sketchs belonging to current user in the given session
    app.route({
        method: 'GET',
        url: '/sessions/:sessionId/sketchs',
        schema: {
            params: sessionIdParamSchema
        },
        handler: async ({ user, params: { sessionId } }, rep) => {
            const session = await controlSessionGameMaster(sessionId, user.id);
            const sketchs = await getUserSessionSketchs(user.id, session.id);
            return rep.send({ sketchs });
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
        handler: async ({ params: { sessionId }, body, user }, rep) => {
            const session = await controlSessionGameMaster(sessionId, user.id);
            const createdSketch = await createSketch({
                ...body,
                userId: user.id,
                sessionId: session.id
            });
            return rep.send(createdSketch);
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
        handler: async ({ params: { sketchId }, body, user }, rep) => {
            await getUserSketchByIdOrThrow(user.id, sketchId);
            const updatedSketch = await updateSketchById(sketchId, body);
            return rep.send(updatedSketch);
        }
    });

    // get a sketch belonging to current user
    app.route({
        method: 'GET',
        url: '/sketchs/:sketchId',
        schema: {
            params: sketchIdParamSchema
        },
        handler: async ({ params: { sketchId }, user }, rep) => {
            const sketch = await getUserSketchByIdOrThrow(user.id, sketchId);
            return rep.send(sketch);
        }
    });

    // delete a sketch belonging to the current user
    app.route({
        method: 'DELETE',
        url: '/sketchs/:sketchId',
        schema: {
            params: sketchIdParamSchema
        },
        handler: async ({ params: { sketchId }, user }, rep) => {
            const sketch = await getUserSketchByIdOrThrow(user.id, sketchId);
            controlSelf(sketch.userId, user);
            await deleteSketchById(sketchId);
            return rep.send({});
        }
    });
};
