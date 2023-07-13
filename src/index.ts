import { app, initApp } from './app';
import { getEnv } from './services/env';
import Log from './services/log';

(async () => {
    await initApp();
    await app.listen({ port: getEnv('PORT'), host: '0.0.0.0' });
    Log.info(`Listening on port ${getEnv('PORT')}`);
})();
