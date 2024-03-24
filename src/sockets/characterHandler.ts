import { type SocketIoServer, type SocketIoSocket } from '../types/socket.js';
import { ForbiddenError } from '../services/errors.js';
import { type Character } from '../drizzle/schema.js';
import { cache } from '../services/cache.js';
import { meta } from './helper.js';
import {
    getCharacterByIdOrThrow,
    getCharacterCacheKey
} from '../controllers/helpers/character.js';

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
            const cachedCharacter = await cache.getJson<Character>(
                getCharacterCacheKey(characterId)
            );
            const character =
                cachedCharacter ?? (await getCharacterByIdOrThrow(characterId));
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
            socket.emit('error', meta(err));
        }
    });
};
