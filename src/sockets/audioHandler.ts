import { Socket, Server } from 'socket.io';

import { Prisma } from '../services/prisma';
import Validator from '../services/validator';
import { SocketAudioPlay } from '../types/socket';
import { ForbiddenError, ValidationError } from '../services/errors';

import audioSchemas from './schemas/audio.json';

const validatePlay = Validator(audioSchemas.play);

const audioHandler = (_io: Server, socket: Socket) => {
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
            const {
                assetId,
                time
            } = request;
            const asset = await Prisma.asset.findUniqueOrThrow({
                where: {
                    id: Number(assetId)
                }
            });
            if (asset.type !== 'audio') {
                throw new ValidationError('Asset type is not audio');
            }
            socket.to(String(sessionId)).emit('audioPlay', {
                user,
                isMaster,
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
            socket.to(String(sessionId)).emit('audioStop', {
                user,
                isMaster
            });
        } catch (err) {
            socket.emit('error', err);
        }
    });
};

export default audioHandler;
