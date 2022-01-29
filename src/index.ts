import 'dotenv/config';
import Express from 'express';
import Helmet from 'helmet';
import Cors from 'cors';

import { errorMiddleware } from './services/errors';
import Log from './services/log';
import { initDb } from './services/prisma';
import apiRouter from './controllers';
import wsRouter from './sockets';

const app = Express();

(async () => {
    try {
        //
        Log.info('Setting middlewares');
        app.use(Cors());
        app.use(Helmet());
        app.use(Express.json());
        app.use(Express.urlencoded({
            extended: false
        }));
        app.use(errorMiddleware);

        Log.info('Initializing API routes');
        app.use(apiRouter);

        Log.info('Initializing database');
        await initDb();

        const port = process.env.PORT ?? 8080;
        const server = app.listen(port, () => {
            Log.info(`Listening on port ${port}`);
            app.emit('ready');
        });

        Log.info('Initializing web sockets');
        wsRouter(server);
        //
    } catch (err: any) {
        Log.error('Error while starting app');
        Log.error(err.stack);
    }
})();

export default app;
