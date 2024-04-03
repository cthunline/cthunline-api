import { type SocketIoServer, type SocketIoSocket } from '../types/socket.js';
import { getSketchCacheKey } from '../controllers/helpers/sketch.js';
import { updateSessionById } from '../services/queries/session.js';
import { validateSchema } from '../services/typebox.js';
import { resetTimeout } from '../services/tools.js';
import { cache } from '../services/cache.js';
import { getEnv } from '../services/env.js';
import { meta } from './helper.js';
import {
    ForbiddenError,
    InternError,
    NotFoundError
} from '../services/errors.js';
import {
    sketchSchema,
    SketchBody,
    tokenSchema,
    TokenBody
} from '../controllers/schemas/definitions.js';

const sketchSaveTimerMs = getEnv('CACHE_SKETCH_SAVE_MS') ?? 1000;

const saveCachedSketch = async (sessionId: number) => {
    const cacheKey = getSketchCacheKey(sessionId);
    const sketch = await cache.getJson<SketchBody>(cacheKey);
    if (sketch) {
        await updateSessionById(sessionId, { sketch });
    } else {
        throw new InternError(
            `Could not retreive sketch with sessionId ${sessionId} from cache while trying to save it`
        );
    }
};

export const sketchHandler = (_io: SocketIoServer, socket: SocketIoSocket) => {
    // updates sketch data (for game master only)
    // notifies other users in the room of the sketch update
    socket.on('sketchUpdate', async (sketch: SketchBody) => {
        try {
            validateSchema(sketchSchema, sketch);
            const { user, sessionId, isMaster } = socket.data;
            if (!isMaster) {
                throw new ForbiddenError();
            }
            const cacheKey = getSketchCacheKey(sessionId);
            const cachedSketch = await cache.getJson<SketchBody>(cacheKey);
            if (!cachedSketch) {
                throw new NotFoundError(
                    'Could not retreive sketch data from cache'
                );
            }
            await cache.setJson<SketchBody>(cacheKey, sketch);
            resetTimeout(
                cacheKey,
                async () => {
                    await saveCachedSketch(sessionId);
                },
                sketchSaveTimerMs
            );
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
            const cacheKey = getSketchCacheKey(sessionId);
            const cachedSketch = await cache.getJson<SketchBody>(cacheKey);
            if (!cachedSketch) {
                throw new NotFoundError(
                    'Could not retreive sketch data from cache'
                );
            }
            const sketch: SketchBody = {
                ...cachedSketch,
                tokens: cachedSketch.tokens?.map((tok: TokenBody) =>
                    tok.id === token.id ? token : tok
                )
            };
            await cache.setJson<SketchBody>(cacheKey, sketch);
            resetTimeout(
                cacheKey,
                async () => {
                    await saveCachedSketch(sessionId);
                },
                sketchSaveTimerMs
            );
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
