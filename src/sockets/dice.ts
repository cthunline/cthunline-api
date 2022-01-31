import { User } from '@prisma/client';
import { Socket } from 'socket.io';
import { sum } from '../services/tools';
import {
    DiceType,
    DiceRequest,
    DiceResult
} from '../types/dice';

const getDiceMax = (diceType: DiceType): number => (
    parseInt(diceType.replace('d', ''))
);

const rollDice = (diceType: DiceType): number => (
    Math.floor((Math.random() * getDiceMax(diceType)) + 1)
);

const getDiceResult = (request: DiceRequest, user: User): DiceResult => ({
    user,
    request,
    result: (
        sum( // sum results of all dice types
            Object.entries(request).map((
                [diceType, diceCount]
            ) => (
                sum( // sum results of one dice type
                    Array(diceCount).map(() => (
                        rollDice(diceType as DiceType)
                    ))
                )
            ))
        )
    )
});

const bindDice = (socket: Socket) => {
    // dice roll request / result visible for every game user
    socket.on('diceRequest', (request: DiceRequest) => {
        const { user, gameId } = socket.data;
        socket.to(gameId).emit(
            'diceResult',
            getDiceResult(request, user)
        );
    });
    // dice roll request / result visible only for the user who requested it
    socket.on('dicePrivateRequest', (request: DiceRequest) => {
        const { user } = socket.data;
        socket.emit(
            'dicePrivateResult',
            getDiceResult(request, user)
        );
    });
};

export default bindDice;
