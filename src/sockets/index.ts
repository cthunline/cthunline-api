import { WebSocketServer } from 'ws';
import { Server } from 'http';
import gameRouter from './game';
import Log from '../services/log';

const wsRouter = (server: Server) => {
    const wsServer = new WebSocketServer({ server });
    wsServer.on('connection', (ws) => {
        Log.info('Web socket connected');
        gameRouter(ws);
    });
};

export default wsRouter;
