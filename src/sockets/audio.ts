import { Asset } from '@prisma/client';
import { Socket, Server } from 'socket.io';

import { Prisma, handleNotFound } from '../services/prisma';
import Validator from '../services/validator';
import { SocketAudioPlay } from '../types/socket';
import { ForbiddenError, ValidationError } from '../services/errors';

import AudioSchemas from './schemas/audio.json';

const validatePlay = Validator(AudioSchemas.play);

const bindAudio = (io: Server, socket: Socket) => {
    // notify session players that game master started playing audio asset
    socket.on('audioPlay', async (request: SocketAudioPlay) => {
        try {
            validatePlay(request);
            const {
                user,
                sessionId,
                isMaster
            } = socket.data;
            if (!isMaster) {
                throw new ForbiddenError();
            }
            const { assetId, time } = request;
            const asset = await handleNotFound<Asset>(
                'Asset', (
                    Prisma.asset.findUnique({
                        where: {
                            id: assetId
                        }
                    })
                )
            );
            if (asset.type !== 'audio') {
                throw new ValidationError('Asset type is not audio');
            }
            socket.to(sessionId).emit('audioPlay', {
                user,
                asset,
                time
            });
        } catch (err) {
            socket.emit('error', err);
        }
    });

    // notify session players that game master stopped playing audio asset
    socket.on('audioStop', async () => {
        try {
            const {
                user,
                sessionId,
                isMaster
            } = socket.data;
            if (!isMaster) {
                throw new ForbiddenError();
            }
            socket.to(sessionId).emit('audioStop', {
                user
            });
        } catch (err) {
            socket.emit('error', err);
        }
    });
};

export default bindAudio;