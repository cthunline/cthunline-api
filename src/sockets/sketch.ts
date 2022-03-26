import { Prisma as PrismaTypes } from '@prisma/client';
import { Socket, Server } from 'socket.io';

import { Prisma } from '../services/prisma';
import Validator from '../services/validator';
import { SketchData } from '../types/socket';
import { ForbiddenError } from '../services/errors';

import SessionSchemas from '../controllers/schemas/session.json';

type JsonObject = PrismaTypes.JsonObject;

const validateUpdate = Validator({
    definitions: SessionSchemas.definitions,
    ...SessionSchemas.sketch
});

const bindSketch = (io: Server, socket: Socket) => {
    // notify session players that sketch has been updated by game master
    socket.on('sketchUpdate', async (data: SketchData) => {
        try {
            validateUpdate(data);
            const {
                user,
                sessionId,
                isMaster
            } = socket.data;
            if (!isMaster) {
                throw new ForbiddenError();
            }
            socket.to(sessionId).emit('sketchUpdate', {
                user,
                isMaster,
                sketch: data
            });
            await Prisma.session.update({
                where: {
                    id: sessionId
                },
                data: {
                    sketch: data as unknown as JsonObject
                }
            });
        } catch (err) {
            socket.emit('error', err);
        }
    });
};

export default bindSketch;
