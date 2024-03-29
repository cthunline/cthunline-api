import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';

import { createSketchSchema, type CreateSketchBody } from './schemas/sketch.js';
import { getUserSketchOrThrow } from './helpers/sketch.js';
import { InternError } from '../services/errors.js';
import { parseParamId } from '../services/api.js';
import { controlSelf } from './helpers/auth.js';
import { db, tables } from '../services/db.js';

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
