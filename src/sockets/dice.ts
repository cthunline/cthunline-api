import { User } from '@prisma/client';
import { Socket, Server } from 'socket.io';

import { sum } from '../services/tools';
import Validator from '../services/validator';
import {
    DiceType,
    DiceRequest,
    DiceResult
} from '../types/dice';

import DiceSchemas from './schemas/dice.json';

const validateRequest = Validator(DiceSchemas.request);

const getDiceMax = (diceType: DiceType): number => (
    parseInt(diceType.replace('d', ''))
);

const rollDice = (diceType: DiceType): number => (
    Math.floor((Math.random() * getDiceMax(diceType)) + 1)
);

const getDiceResult = (request: DiceRequest, user: User): DiceResult => {
    validateRequest(request);
    return {
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
    };
};

const bindDice = (io: Server, socket: Socket) => {
    // dice roll request / result sent to every player in session
    socket.on('diceRequest', (request: DiceRequest) => {
        try {
            const { user, sessionId } = socket.data;
            io.sockets.to(sessionId).emit(
                'diceResult',
                getDiceResult(request, user)
            );
        } catch (err) {
            socket.emit('error', err);
        }
    });

    // private dice roll request / result sent only to the user who requested it
    socket.on('dicePrivateRequest', (request: DiceRequest) => {
        try {
            const { user } = socket.data;
            socket.emit(
                'dicePrivateResult',
                getDiceResult(request, user)
            );
        } catch (err) {
            socket.emit('error', err);
        }
    });
};

export default bindDice;
