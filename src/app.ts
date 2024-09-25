import 'dotenv/config';

import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import fastify from 'fastify';
import fastifySocketIo from 'fastify-socket.io';
import qs from 'qs';

import { mainController } from './controllers/index.js';
import { migrateData } from './migrations/index.js';
import { initDb, migrateDb } from './services/db.js';
import { getEnv } from './services/env.js';
import { errorHandler, schemaErrorFormatter } from './services/errors.js';
import { log } from './services/log.js';
import { setValidatorCompilers } from './services/validator.js';
import { socketRouter } from './sockets/index.js';

export const app = fastify({
    loggerInstance: log,
    trustProxy: getEnv('REVERSE_PROXY'),
    querystringParser: (str) => qs.parse(str)
});

// set schema validation compilers
setValidatorCompilers(app);

export const initApp = async () => {
    try {
        log.info('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
        log.info('~~~~~~~ Cthunline API Server ~~~~~~~');
        log.info('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
        log.info('Registering middlewares');
        // cookie parser
        await app.register(fastifyCookie, {
            secret: getEnv('COOKIE_SECRET')
        });
        // helmet middlewares (security)
        await app.register(fastifyHelmet);
        // multipart middleware (file upload)
        await app.register(fastifyMultipart);
        // socket.io middleware
        await app.register(fastifySocketIo);
        // custom error handler
        app.setErrorHandler(errorHandler);
        // custom schema error formatter
        app.setSchemaErrorFormatter(schemaErrorFormatter);
        // database
        log.info('Migrating database schema');
        await migrateDb();
        log.info('Initializing database');
        await initDb();
        // data migrations
        log.info('Migrating data');
        await migrateData();
        // api routes
        log.info('Registering routes');
        await app.register(mainController);
        // web sockets
        log.info('Initializing web sockets');
        socketRouter(app);
        // emit ready event
        app.ready();
    } catch (err: unknown) {
        log.error('Error while starting app');
        log.error(err instanceof Error ? err.stack : err);
    }
};
