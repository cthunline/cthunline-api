import Express from 'express';
import Helmet from 'helmet';
import Cors from 'cors';

import { errorMiddleware } from './services/errors';
import Log from './services/log';
import { initDb } from './services/prisma';
import router from './controllers';

const app = Express();

(async () => {
    try {
        Log.info('Setting middlewares');
        app.use(Cors());
        app.use(Helmet());
        app.use(Express.json());
        app.use(Express.urlencoded({
            extended: false
        }));
        app.use(errorMiddleware);

        Log.info('Setting routes');
        app.use(router);

        Log.info('Initializing database');
        await initDb();

        const port = 8198;
        app.listen(port, () => {
            Log.info(`API running on port ${port}`);
            app.emit('ready');
        });
    } catch (err: any) {
        Log.error('Error while starting app');
        Log.error(err.stack);
    }
})();

export default app;
