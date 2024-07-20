import { ForbiddenError, ValidationError } from '../services/errors.js';
import { getAssetByIdOrThrow } from '../services/queries/asset.js';
import { validateSchema } from '../services/typebox.js';
import type { SocketIoServer, SocketIoSocket } from '../types/socket.js';
import { meta } from './helper.js';
import { type PlayAudioBody, playAudioSchema } from './schemas/audio.js';

export const audioHandler = (_io: SocketIoServer, socket: SocketIoSocket) => {
    // notify session players that game master started playing audio asset
    socket.on('audioPlay', async (request: PlayAudioBody) => {
        try {
            validateSchema(playAudioSchema, request);
            const { user, sessionId, isMaster } = socket.data;
            if (!isMaster) {
                throw new ForbiddenError();
            }
            const { assetId, time } = request;
            const asset = await getAssetByIdOrThrow(Number(assetId));
            if (asset.type !== 'audio') {
                throw new ValidationError('Asset type is not audio');
            }
            socket.to(String(sessionId)).emit(
                'audioPlay',
                meta({
                    user,
                    isMaster,
                    asset,
                    time
                })
            );
        } catch (err) {
            socket.emit('error', meta(err));
        }
    });

    // notify session players that game master stopped playing audio asset
    socket.on('audioStop', async () => {
        try {
            const { user, sessionId, isMaster } = socket.data;
            if (!isMaster) {
                throw new ForbiddenError();
            }
            socket.to(String(sessionId)).emit(
                'audioStop',
                meta({
                    user,
                    isMaster
                })
            );
        } catch (err) {
            socket.emit('error', meta(err));
        }
    });
};
