import { randomInt } from 'node:crypto';

import type { SafeUser } from '../drizzle/schema.js';
import { ForbiddenError } from '../services/errors.js';
import { sum } from '../services/tools.js';
import { validateSchema } from '../services/typebox.js';
import type {
    DiceType,
    SocketDiceResult,
    SocketDiceResultDetails
} from '../types/dice.js';
import type { SocketIoServer, SocketIoSocket } from '../types/socket.js';
import { meta } from './helper.js';
import { type RequestDiceBody, requestDiceSchema } from './schemas/dice.js';

const getDiceMax = (diceType: DiceType): number =>
    Number.parseInt(diceType.replace('D', ''));

const rollDice = (diceType: DiceType): number =>
    randomInt(getDiceMax(diceType)) + 1;

const getDiceResult = (
    user: SafeUser,
    isMaster: boolean,
    request: RequestDiceBody,
    isPrivate = false
): SocketDiceResult => {
    const details: SocketDiceResultDetails = {};
    for (const diceType of Object.keys(request) as DiceType[]) {
        const diceCount = request[diceType];
        details[diceType] = [...Array(diceCount)].map(() => rollDice(diceType));
    }
    return {
        user,
        isMaster,
        request,
        isPrivate,
        total: sum(
            Object.values(details).map((diceResults) => sum(diceResults))
        ),
        details
    };
};

export const diceHandler = (io: SocketIoServer, socket: SocketIoSocket) => {
    // dice roll request / result sent to every player in session
    socket.on('diceRequest', (request: RequestDiceBody) => {
        try {
            validateSchema(requestDiceSchema, request);
            const { user, isMaster, sessionId } = socket.data;
            io.sockets
                .to(String(sessionId))
                .emit(
                    'diceResult',
                    meta(getDiceResult(user, isMaster, request))
                );
        } catch (err) {
            socket.emit('error', meta(err));
        }
    });

    // private dice roll request for game master
    // result sent only to the user who requested it
    socket.on('dicePrivateRequest', (request: RequestDiceBody) => {
        try {
            validateSchema(requestDiceSchema, request);
            const { user, isMaster } = socket.data;
            if (!isMaster) {
                throw new ForbiddenError();
            }
            socket.emit(
                'diceResult',
                meta(getDiceResult(user, isMaster, request, true))
            );
        } catch (err) {
            socket.emit('error', meta(err));
        }
    });
};
