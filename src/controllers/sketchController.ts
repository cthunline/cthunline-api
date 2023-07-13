import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { parseParamId } from '../services/api';
import { Prisma } from '../services/prisma';

import { controlSelf } from './helpers/auth';

import { createSketchSchema, CreateSketchBody } from './schemas/sketch';

const sketchController = async (app: FastifyInstance) => {
    // get all sketchs belonging to current user
    app.route({
        method: 'GET',
        url: '/sketchs',
        handler: async ({ user }: FastifyRequest, rep: FastifyReply) => {
            const userId = user.id;
            const sketchs = await Prisma.sketch.findMany({
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
            const sketch = await Prisma.sketch.create({
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
            const sketch = await Prisma.sketch.findFirstOrThrow({
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
            const sketch = await Prisma.sketch.findFirstOrThrow({
                where: {
                    id: sketchId
                }
            });
            controlSelf(sketch.userId, user);
            await Prisma.sketch.delete({
                where: {
                    id: sketchId
                }
            });
            rep.send({});
        }
    });
};

export default sketchController;
