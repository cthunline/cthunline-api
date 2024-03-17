import { app, initApp } from './app.js';
import { getEnv } from './services/env.js';
import Log from './services/log.js';

(async () => {
    await initApp();
    await app.listen({ port: getEnv('PORT'), host: '0.0.0.0' });
    Log.info(`Listening on port ${getEnv('PORT')}`);
})();
