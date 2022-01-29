import WebSocket from 'ws';
import Log from '../services/log';
// import { ConflictError } from '../services/errors';

const gameRouter = (ws: WebSocket) => {
    ws.on('message', (data) => {
        Log.info('received message from client');
        Log.info(data);
    });
    ws.send('hello from server');
};

export default gameRouter;
