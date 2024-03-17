import { type SocketIoServer, type SocketIoSocket } from '../types/socket.js';
import { cacheGet, cacheSave, cacheSet } from '../services/cache.js';
import { validateSchema } from '../services/typebox.js';
import { ForbiddenError } from '../services/errors.js';
import { Prisma } from '../services/prisma.js';

import { meta } from './helper.js';

import {
    sketchSchema,
    SketchBody,
    tokenSchema,
    TokenBody
} from '../controllers/schemas/definitions.js';

const sketchCacheSaver = (sessionId: number) => (data: SketchBody) =>
    Prisma.session.update({
        where: {
            id: sessionId
        },
        data: {
            sketch: data
        }
    });

const sketchHandler = (_io: SocketIoServer, socket: SocketIoSocket) => {
    // updates sketch data (for game master only)
    // notifies other users in the room of the sketch update
    socket.on('sketchUpdate', async (sketch: SketchBody) => {
        try {
            validateSchema(sketchSchema, sketch);
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
        } catch (err: unknown) {
            socket.emit('error', meta(err));
        }
    });

    // updates a sketch token
    // notifies other users in the room of the sketch update
    socket.on('tokenUpdate', async (token: TokenBody) => {
        try {
            validateSchema(tokenSchema, token);
            const { user, sessionId, isMaster } = socket.data;
            const cacheId = `sketch-${sessionId}`;
            cacheGet(cacheId, true);
            const sketch = cacheSet(cacheId, (previous) => ({
                ...previous,
                tokens: previous.tokens.map((tok: TokenBody) =>
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
