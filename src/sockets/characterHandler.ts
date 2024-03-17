import { type SocketIoServer, type SocketIoSocket } from '../types/socket.js';
import { prisma } from '../services/prisma.js';

import { meta } from './helper.js';
import { ForbiddenError } from '../services/errors.js';

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
            const character = await prisma.character.findUniqueOrThrow({
                where: {
                    id: characterId
                }
            });
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
