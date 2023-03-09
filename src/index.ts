import 'dotenv/config';
import Express from 'express';
import CookieParser from 'cookie-parser';
import { createServer } from 'http';
import Helmet from 'helmet';

import { errorMiddleware, payloadTooLargeHandler } from './services/errors';
import Log from './services/log';
import { initDb } from './services/prisma';
import { env } from './services/env';
import mainController from './controllers';
import socketRouter from './sockets';

const app = Express();
const httpServer = createServer(app);

const { REVERSE_PROXY, COOKIE_SECRET, PORT } = env;

(async () => {
    try {
        if (REVERSE_PROXY) {
            Log.info('Set Express app trust proxy');
            app.set('trust proxy', true);
        }

        Log.info('Setting middlewares');
        app.use(CookieParser(COOKIE_SECRET));
        app.use(Helmet());
        app.use(Express.json());
        app.use(
            Express.urlencoded({
                extended: false
            })
        );
        app.use(payloadTooLargeHandler);
        app.use(errorMiddleware);

        Log.info('Initializing database');
        await initDb();

        Log.info('Initializing routes');
        app.use(mainController);

        Log.info('Initializing web sockets');
        socketRouter(httpServer);

        httpServer.listen(PORT, () => {
            Log.info(`Listening on port ${PORT}`);
            app.emit('ready');
        });
    } catch (err: any) {
        Log.error('Error while starting app');
        Log.error(err.stack);
    }
})();

export default app;
