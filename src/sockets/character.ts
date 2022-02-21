import { Character } from '@prisma/client';
import { Socket, Server } from 'socket.io';
import { InternError } from '../services/errors';

import { Prisma, handleNotFound } from '../services/prisma';

const bindCharacter = (io: Server, socket: Socket) => {
    // notify game master when any character is updated during game
    // send character data to game master
    socket.on('characterUpdate', async () => {
        try {
            const {
                user,
                sessionId,
                characterId
            } = socket.data;
            const character = await handleNotFound<Character>(
                'Character', (
                    Prisma.character.findUnique({
                        where: {
                            id: characterId
                        }
                    })
                )
            );
            const sessionSockets = await io.in(sessionId).fetchSockets();
            const masterSocket = sessionSockets.find(({ data }) => (
                data.isMaster
            ));
            if (masterSocket) {
                masterSocket.emit('characterUpdate', {
                    user,
                    character
                });
            } else {
                throw new InternError('Could not get game master socket');
            }
        } catch (err) {
            socket.emit('error', err);
        }
    });
};

export default bindCharacter;
