import { User } from '@prisma/client';
import { Socket, Server } from 'socket.io';
import { randomInt } from 'crypto';

import { sum } from '../services/tools';
import Validator from '../services/validator';
import { ForbiddenError } from '../services/errors';
import { DiceType } from '../types/dice';
import { SocketDiceRequest, SocketDiceResult } from '../types/socket';
import { meta } from './helper';

import diceSchemas from './schemas/dice.json';

const validateRequest = Validator(diceSchemas.request);

const getDiceMax = (diceType: DiceType): number =>
    parseInt(diceType.replace('D', ''));

const rollDice = (diceType: DiceType): number =>
    randomInt(getDiceMax(diceType)) + 1;

const getDiceResult = (
    user: User,
    isMaster: boolean,
    request: SocketDiceRequest,
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
    socket.on('diceRequest', async (request: SocketDiceRequest) => {
        try {
            validateRequest(request);
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
    socket.on('dicePrivateRequest', async (request: SocketDiceRequest) => {
        try {
            validateRequest(request);
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
