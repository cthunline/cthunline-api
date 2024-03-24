import 'dotenv/config';

import Fastify from 'fastify';
import FastifyFormidable from 'fastify-formidable';
import FastifySocketIo from 'fastify-socket.io';
import FastifyCookie from '@fastify/cookie';
import FastifyHelmet from '@fastify/helmet';
import ajvFormats from 'ajv-formats';
import FastifyQs from 'fastify-qs';

import { errorHandler, schemaErrorFormatter } from './services/errors.js';
import { mainController } from './controllers/index.js';
import { initDb, migrateDb } from './services/db.js';
import { socketRouter } from './sockets/index.js';
import { getEnv } from './services/env.js';
import { log } from './services/log.js';

export const app = Fastify({
    trustProxy: getEnv('REVERSE_PROXY'),
    ajv: {
        plugins: [ajvFormats],
        customOptions: {
            removeAdditional: false,
            coerceTypes: false
        }
    }
});

export const initApp = async () => {
    try {
        log.info('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
        log.info('~~~~~~~ Cthunline API Server ~~~~~~~');
        log.info('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

        log.info('Registering middlewares');
        // cookie parser
        await app.register(FastifyCookie, {
            secret: getEnv('COOKIE_SECRET')
        });
        // query params parser
        await app.register(FastifyQs);
        // helmet middlewares (security)
        await app.register(FastifyHelmet);
        // formidable middleware (file upload)
        await app.register(FastifyFormidable);
        // socket.io middleware
        await app.register(FastifySocketIo);
        // handler for too large payloads
        // app.use(payloadTooLargeHandler);
        // custom error handler
        app.setErrorHandler(errorHandler);
        // custom schema error formatter
        app.setSchemaErrorFormatter(schemaErrorFormatter);

        log.info('Migrating database');
        await migrateDb();
        log.info('Initializing database');
        await initDb();

        log.info('Registering routes');
        await app.register(mainController);

        log.info('Initializing web sockets');
        socketRouter(app);

        // emit ready event
        app.ready();
    } catch (err: any) {
        log.error('Error while starting app');
        log.error(err.stack);
    }
};
