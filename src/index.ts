import { app, initApp } from './app.js';
import { getEnv } from './services/env.js';

await initApp();

await app.listen({
    host: getEnv('HOST') ?? '0.0.0.0',
    port: getEnv('PORT') ?? 8080
});
