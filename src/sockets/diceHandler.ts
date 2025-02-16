import { getAlienRollResult, getDiceResult } from '../services/dice.js';
import { ForbiddenError } from '../services/errors.js';
import { validateSchema } from '../services/typebox.js';
import type { SocketIoServer, SocketIoSocket } from '../types/socket.js';
import { meta, socketError } from './helper.js';
import {
    type AlienRollRequest,
    type DiceRequestBody,
    alienRollSchema,
    diceRequestSchema
} from './schemas/dice.js';

const controlPrivateRoll = ({ isMaster }: { isMaster: boolean }) => {
    if (!isMaster) {
        throw new ForbiddenError();
    }
};

export const diceHandler = (io: SocketIoServer, socket: SocketIoSocket) => {
    // ---------------------------------------- standard rolls

    // dice roll request / result sent to every player in session
    socket.on('diceRequest', (request: DiceRequestBody) => {
        try {
            validateSchema(diceRequestSchema, request);
            const { user, isMaster, sessionId } = socket.data;
            io.sockets
                .to(String(sessionId))
                .emit(
                    'diceResult',
                    meta(getDiceResult(user, isMaster, request))
                );
        } catch (err) {
            socket.emit('error', socketError(err));
        }
    });

    // private dice roll request for game master
    // result sent only to the user who requested it
    socket.on('dicePrivateRequest', (request: DiceRequestBody) => {
        try {
            validateSchema(diceRequestSchema, request);
            controlPrivateRoll(socket.data);
            const { user, isMaster } = socket.data;
            socket.emit(
                'diceResult',
                meta(getDiceResult(user, isMaster, request, true))
            );
        } catch (err) {
            socket.emit('error', socketError(err));
        }
    });

    // ---------------------------------------- game rolls

    // public alien dice roll
    socket.on('diceAlienRequest', (request: AlienRollRequest) => {
        try {
            validateSchema(alienRollSchema, request);
            const { user, isMaster, sessionId } = socket.data;
            io.sockets
                .to(String(sessionId))
                .emit(
                    'diceAlienResult',
                    meta(getAlienRollResult(user, isMaster, request))
                );
        } catch (err) {
            socket.emit('error', socketError(err));
        }
    });

    // private alien dice roll
    socket.on('diceAlienPrivateRequest', (request: AlienRollRequest) => {
        try {
            validateSchema(alienRollSchema, request);
            controlPrivateRoll(socket.data);
            const { user, isMaster } = socket.data;
            socket.emit(
                'diceAlienResult',
                meta(getAlienRollResult(user, isMaster, request, true))
            );
        } catch (err) {
            socket.emit('error', socketError(err));
        }
    });
};
