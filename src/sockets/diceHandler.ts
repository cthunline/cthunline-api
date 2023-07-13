import { Socket, Server } from 'socket.io';
import { randomInt } from 'crypto';

import { validateSchema } from '../services/typebox';
import { ForbiddenError } from '../services/errors';
import { sum } from '../services/tools';

import { meta } from './helper';

import { DiceType, SocketDiceResult } from '../types/dice';
import { SafeUser } from '../types/user';

import { requestDiceSchema, RequestDiceBody } from './schemas/dice';

const getDiceMax = (diceType: DiceType): number =>
    parseInt(diceType.replace('D', ''));

const rollDice = (diceType: DiceType): number =>
    randomInt(getDiceMax(diceType)) + 1;

const getDiceResult = (
    user: SafeUser,
    isMaster: boolean,
    request: RequestDiceBody,
    isPrivate: boolean = false
): SocketDiceResult => ({
    user,
    isMaster,
    request,
    isPrivate,
    result: sum(
        // sum results of all dice types
        Object.entries(request).map(([diceType, diceCount]) =>
            sum(
                // sum results of one dice type
                [...Array(diceCount)].map(() => rollDice(diceType as DiceType))
            )
        )
    )
});

const diceHandler = (io: Server, socket: Socket) => {
    // dice roll request / result sent to every player in session
    socket.on('diceRequest', async (request: RequestDiceBody) => {
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
    socket.on('dicePrivateRequest', async (request: RequestDiceBody) => {
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

export default diceHandler;
