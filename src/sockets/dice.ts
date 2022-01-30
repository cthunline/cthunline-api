import { Socket } from 'socket.io';
import Log from '../services/log';
import { DiceRequest } from '../types/dice';

const bindDice = (socket: Socket) => {
    socket.on('dice', (data: DiceRequest) => {
        Log.info(`Requesting dice ${JSON.stringify(data)}`);
    });
};

export default bindDice;
