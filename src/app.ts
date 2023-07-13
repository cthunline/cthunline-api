import 'dotenv/config';

import Fastify from 'fastify';
import FastifyFormidable from 'fastify-formidable';
import FastifySocketIo from 'fastify-socket.io';
import FastifyCookie from '@fastify/cookie';
import FastifyHelmet from '@fastify/helmet';
import FastifyQs from 'fastify-qs';
import AjvFormats from 'ajv-formats';

import mainController from './controllers';
import socketRouter from './sockets';

import { errorHandler, schemaErrorFormatter } from './services/errors';
import { initDb } from './services/prisma';
import { getEnv } from './services/env';
import Log from './services/log';

export const app = Fastify({
    trustProxy: getEnv('REVERSE_PROXY'),
    ajv: {
        plugins: [AjvFormats],
        customOptions: {
            removeAdditional: false,
            coerceTypes: false
        }
    }
});

export const initApp = async () => {
    try {
        Log.info('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
        Log.info('~~~~~~~ Cthunline API Server ~~~~~~~');
        Log.info('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

        Log.info('Registering middlewares');
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

        Log.info('Initializing database');
        await initDb();

        Log.info('Registering routes');
        await app.register(mainController);

        Log.info('Initializing web sockets');
        socketRouter(app);

        // emit ready event
        app.ready();
    } catch (err: any) {
        Log.error('Error while starting app');
        Log.error(err.stack);
    }
};
