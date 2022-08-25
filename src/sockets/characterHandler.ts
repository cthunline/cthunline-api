import { Socket, Server } from 'socket.io';

import { Prisma } from '../services/prisma';

const characterHandler = (io: Server, socket: Socket) => {
    // notify game master when any character is updated during game
    // send character data to game master
    socket.on('characterUpdate', async () => {
        try {
            const {
                user,
                isMaster,
                sessionId,
                characterId
            } = socket.data;
            const character = await Prisma.character.findUniqueOrThrow({
                where: {
                    id: characterId
                }
            });
            socket.data.character = character;
            const sessionSockets = await io.in(String(sessionId)).fetchSockets();
            const masterSocket = sessionSockets.find(({ data }) => (
                data.isMaster
            ));
            if (masterSocket) {
                masterSocket.emit('characterUpdate', {
                    user,
                    isMaster,
                    character
                });
            }
        } catch (err) {
            socket.emit('error', err);
        }
    });
};

export default characterHandler;
