import { getCharacterCacheKey } from '../controllers/helpers/character.js';
import type { Character } from '../drizzle/schema.js';
import { cache } from '../services/cache.js';
import { ForbiddenError } from '../services/errors.js';
import { getCharacterByIdOrThrow } from '../services/queries/character.js';
import type { SocketIoServer, SocketIoSocket } from '../types/socket.js';
import { meta, socketError } from './helper.js';

export const characterHandler = (
    io: SocketIoServer,
    socket: SocketIoSocket
) => {
    // notify game master when any character is updated during game
    // send character data to game master
    socket.on('characterUpdate', async () => {
        try {
            if (socket.data.isMaster) {
                throw new ForbiddenError();
            }
            const { user, isMaster, sessionId, characterId } = socket.data;
            const cacheKey = getCharacterCacheKey(characterId);
            const cachedCharacter = await cache.getJson<Character>(cacheKey);
            const character =
                cachedCharacter ?? (await getCharacterByIdOrThrow(characterId));
            if (!cachedCharacter) {
                await cache.setJson<Character>(cacheKey, character);
            }
            socket.data.character = character;
            const sessionSockets = await io
                .in(String(sessionId))
                .fetchSockets();
            const masterSocket = sessionSockets.find(
                ({ data }) => data.isMaster
            );
            if (masterSocket) {
                masterSocket.emit(
                    'characterUpdate',
                    meta({
                        user,
                        isMaster,
                        character
                    })
                );
            }
        } catch (err) {
            socket.emit('error', socketError(err));
        }
    });
};
