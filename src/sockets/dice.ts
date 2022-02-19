import { User } from '@prisma/client';
import { Socket, Server } from 'socket.io';

import { sum } from '../services/tools';
import Validator from '../services/validator';
import { ForbiddenError } from '../services/errors';
import { DiceType } from '../types/dice';
import {
    SocketDiceRequest,
    SocketDiceResult
} from '../types/socket';

import DiceSchemas from './schemas/dice.json';

const validateRequest = Validator(DiceSchemas.request);

const getDiceMax = (diceType: DiceType): number => (
    parseInt(diceType.replace('d', ''))
);

const rollDice = (diceType: DiceType): number => (
    Math.floor((Math.random() * getDiceMax(diceType)) + 1)
);

const getDiceResult = (request: SocketDiceRequest, user: User): SocketDiceResult => ({
    user,
    request,
    result: (
        sum( // sum results of all dice types
            Object.entries(request).map((
                [diceType, diceCount]
            ) => (
                sum( // sum results of one dice type
                    [...Array(diceCount)].map(() => (
                        rollDice(diceType as DiceType)
                    ))
                )
            ))
        )
    )
});

const bindDice = (io: Server, socket: Socket) => {
    // dice roll request / result sent to every player in session
    socket.on('diceRequest', async (request: SocketDiceRequest) => {
        try {
            validateRequest(request);
            const { user, sessionId } = socket.data;
            io.sockets.to(sessionId).emit(
                'diceResult',
                getDiceResult(request, user)
            );
        } catch (err) {
            socket.emit('error', err);
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
                getDiceResult(request, user)
            );
        } catch (err) {
            socket.emit('error', err);
        }
    });
};

export default bindDice;
