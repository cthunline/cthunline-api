import { Character } from '@prisma/client';
import { Socket, Server } from 'socket.io';

import { Prisma, handleNotFound } from '../services/prisma';
import Validator from '../services/validator';
import { SocketCharacterUpdate } from '../types/socket';

import CharacterSchemas from './schemas/character.json';

const validateUpdate = Validator(CharacterSchemas.update);

const bindCharacter = (io: Server, socket: Socket) => {
    // notify game master when any character is updated during game
    // send character data to game master
    socket.on('characterUpdate', async (request: SocketCharacterUpdate) => {
        try {
            validateUpdate(request);
            const { user, sessionId } = socket.data;
            const { characterId } = request;
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
            masterSocket?.emit('characterUpdate', {
                user,
                character
            });
        } catch (err) {
            socket.emit('error', err);
        }
    });
};

export default bindCharacter;
