import { randomInt } from 'node:crypto';

import type { SafeUser } from '../drizzle/schema.js';
import { diceValues } from '../services/dice.js';
import { ForbiddenError } from '../services/errors.js';
import { validateSchema } from '../services/typebox.js';
import type {
    DiceAggregatedRolls,
    DiceResult,
    DiceType,
    SocketDiceResult
} from '../types/dice.js';
import type { SocketIoServer, SocketIoSocket } from '../types/socket.js';
import { meta } from './helper.js';
import {
    type DiceRequestBody,
    type DiceRequestRoll,
    diceRequestSchema
} from './schemas/dice.js';

const sortDiceRequestRolls = (rolls: DiceRequestRoll[]) =>
    rolls.toSorted((a, b) => {
        if (a.dice !== b.dice) {
            return (
                (diceValues.get(a.dice) ?? 0) - (diceValues.get(b.dice) ?? 0)
            );
        }
        if (!a.color) {
            return 1;
        }
        if (!b.color) {
            return -1;
        }
        return a.color.localeCompare(b.color);
    });

const getDiceMax = (diceType: DiceType): number =>
    Number.parseInt(diceType.replace('D', ''));

const rollDice = (diceType: DiceType): number =>
    randomInt(getDiceMax(diceType)) + 1;

const getDiceResult = (
    user: SafeUser,
    isMaster: boolean,
    { rolls }: DiceRequestBody,
    isPrivate = false
): SocketDiceResult => {
    const sortedRolls = sortDiceRequestRolls(rolls);
    const aggregatedRolls: DiceAggregatedRolls = {};
    const results: DiceResult[] = [];
    let total = 0;
    for (const dReq of sortedRolls) {
        aggregatedRolls[dReq.dice] = (aggregatedRolls[dReq.dice] ?? 0) + 1;
        const result = rollDice(dReq.dice);
        results.push({ ...dReq, result });
        total += result;
    }
    return {
        user,
        isMaster,
        rolls,
        aggregatedRolls,
        isPrivate,
        total,
        results
    };
};

export const diceHandler = (io: SocketIoServer, socket: SocketIoSocket) => {
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
            socket.emit('error', meta(err));
        }
    });

    // private dice roll request for game master
    // result sent only to the user who requested it
    socket.on('dicePrivateRequest', (request: DiceRequestBody) => {
        try {
            validateSchema(diceRequestSchema, request);
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
