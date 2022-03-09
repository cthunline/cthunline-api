import 'dotenv/config';
import Express from 'express';
import { createServer } from 'http';
import Helmet from 'helmet';
import Cors from 'cors';

import {
    errorMiddleware,
    payloadTooLargeHandler
} from './services/errors';
import Log from './services/log';
import { initDb } from './services/prisma';
import apiRouter from './controllers';
import socketRouter from './sockets';

const app = Express();
const httpServer = createServer(app);

(async () => {
    try {
        Log.info('Setting middlewares');
        app.use(Cors());
        app.use(Helmet());
        app.use(Express.json({
            limit: '300kb'
        }));
        app.use(Express.urlencoded({
            extended: false
        }));
        app.use(payloadTooLargeHandler);
        app.use(errorMiddleware);

        Log.info('Initializing database');
        await initDb();

        Log.info('Initializing API routes');
        app.use(apiRouter);

        Log.info('Initializing web sockets');
        socketRouter(httpServer);

        const port = process.env.PORT ?? 8080;
        httpServer.listen(port, () => {
            Log.info(`Listening on port ${port}`);
            app.emit('ready');
        });
    } catch (err: any) {
        Log.error('Error while starting app');
        Log.error(err.stack);
    }
})();

export default app;
