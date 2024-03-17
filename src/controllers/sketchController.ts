import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { parseParamId } from '../services/api.js';
import { prisma } from '../services/prisma.js';

import { controlSelf } from './helpers/auth.js';

import { createSketchSchema, CreateSketchBody } from './schemas/sketch.js';

export const sketchController = async (app: FastifyInstance) => {
    // get all sketchs belonging to current user
    app.route({
        method: 'GET',
        url: '/sketchs',
        handler: async ({ user }: FastifyRequest, rep: FastifyReply) => {
            const userId = user.id;
            const sketchs = await prisma.sketch.findMany({
                where: {
                    userId
                }
            });
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
            const sketch = await prisma.sketch.create({
                data: {
                    ...body,
                    userId: user.id
                }
            });
            rep.send(sketch);
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
            const sketch = await prisma.sketch.findFirstOrThrow({
                where: {
                    id: sketchId,
                    userId: user.id
                }
            });
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
            const sketch = await prisma.sketch.findFirstOrThrow({
                where: {
                    id: sketchId
                }
            });
            controlSelf(sketch.userId, user);
            await prisma.sketch.delete({
                where: {
                    id: sketchId
                }
            });
            rep.send({});
        }
    });
};
