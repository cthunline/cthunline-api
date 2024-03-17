import { app, initApp } from './app.js';
import { getEnv } from './services/env.js';
import { log } from './services/log.js';

(async () => {
    await initApp();
    await app.listen({ port: getEnv('PORT'), host: '0.0.0.0' });
    log.info(`Listening on port ${getEnv('PORT')}`);
})();
