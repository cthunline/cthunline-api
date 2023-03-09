import { Prisma as PrismaTypes } from '@prisma/client';
import { Socket, Server } from 'socket.io';

import { Prisma } from '../services/prisma';
import Validator from '../services/validator';
import { ForbiddenError } from '../services/errors';
import { SketchData, SketchTokenData } from '../types/socket';
import { cacheGet, cacheSave, cacheSet } from '../services/cache';
import { meta } from './helper';

import { definitions } from '../controllers/schemas/definitions.json';

type JsonObject = PrismaTypes.JsonObject;

const validateSketchUpdate = Validator({
    ...definitions.sketch,
    definitions
});
const validateSketchToken = Validator({
    ...definitions.token,
    definitions
});

const sketchCacheSaver = (sessionId: number) => (data: SketchData) =>
    Prisma.session.update({
        where: {
            id: sessionId
        },
        data: {
            sketch: data as unknown as JsonObject
        }
    });

const sketchHandler = (_io: Server, socket: Socket) => {
    // updates sketch data (for game master only)
    // notifies other users in the room of the sketch update
    socket.on('sketchUpdate', async (sketch: SketchData) => {
        try {
            validateSketchUpdate(sketch);
            const { user, sessionId, isMaster } = socket.data;
            if (!isMaster) {
                throw new ForbiddenError();
            }
            const cacheId = `sketch-${sessionId}`;
            cacheGet(cacheId, true);
            cacheSet(cacheId, () => sketch);
            const saver = sketchCacheSaver(sessionId);
            cacheSave(cacheId, saver, 1000);
            socket.to(String(sessionId)).emit(
                'sketchUpdate',
                meta({
                    user,
                    isMaster,
                    sketch
                })
            );
        } catch (err: any) {
            socket.emit('error', meta(err));
        }
    });

    // updates a sketch token
    // notifies other users in the room of the sketch update
    socket.on('tokenUpdate', async (token: SketchTokenData) => {
        try {
            validateSketchToken(token);
            const { user, sessionId, isMaster } = socket.data;
            const cacheId = `sketch-${sessionId}`;
            cacheGet(cacheId, true);
            const sketch = cacheSet(cacheId, (previous) => ({
                ...previous,
                tokens: previous.tokens.map((tok: SketchTokenData) =>
                    tok.id === token.id ? token : tok
                )
            }));
            const saver = sketchCacheSaver(sessionId);
            cacheSave(cacheId, saver, 1000);
            socket.to(String(sessionId)).emit(
                'sketchUpdate',
                meta({
                    user,
                    isMaster,
                    sketch
                })
            );
        } catch (err) {
            socket.emit('error', meta(err));
        }
    });
};

export default sketchHandler;
