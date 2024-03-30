import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';

import { getUserSketchOrThrow } from './helpers/sketch.js';
import { InternError } from '../services/errors.js';
import { parseParamId } from '../services/api.js';
import { controlSelf } from './helpers/auth.js';
import { db, tables } from '../services/db.js';
import {
    createSketchSchema,
    type CreateSketchBody,
    updateSketchSchema,
    type UpdateSketchBody
} from './schemas/sketch.js';

export const sketchController = async (app: FastifyInstance) => {
    // get all sketchs belonging to current user
    app.route({
        method: 'GET',
        url: '/sketchs',
        handler: async ({ user }: FastifyRequest, rep: FastifyReply) => {
            const userId = user.id;
            const sketchs = await db
                .select()
                .from(tables.sketchs)
                .where(eq(tables.sketchs.userId, userId));
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
            const createdSketchs = await db
                .insert(tables.sketchs)
                .values({
                    ...body,
                    userId: user.id
                })
                .returning();
            const createdSketch = createdSketchs[0];
            if (!createdSketch) {
                throw new InternError('Could not retreive inserted sketch');
            }
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
            await getUserSketchOrThrow(sketchId, user.id);
            const updatedSketchs = await db
                .update(tables.sketchs)
                .set(body)
                .where(eq(tables.sketchs.id, sketchId))
                .returning();
            const updatedSketch = updatedSketchs[0];
            if (!updatedSketch) {
                throw new InternError('Could not retreive updated sketch');
            }
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
            const sketch = await getUserSketchOrThrow(sketchId, user.id);
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
            const sketch = await getUserSketchOrThrow(sketchId, user.id);
            controlSelf(sketch.userId, user);
            await db
                .delete(tables.sketchs)
                .where(eq(tables.sketchs.id, sketchId));
            rep.send({});
        }
    });
};
