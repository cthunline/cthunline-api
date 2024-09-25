import { app, initApp } from './app.js';
import { getEnv } from './services/env.js';
import { log } from './services/log.js';

await initApp();
log.always('Starting server listening');
await app.listen({ port: getEnv('PORT'), host: '0.0.0.0' });
