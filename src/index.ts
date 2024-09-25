import { app, initApp } from './app.js';
import { getEnv } from './services/env.js';

await initApp();

await app.listen({
    port: getEnv('PORT'),
    host: '0.0.0.0'
});
