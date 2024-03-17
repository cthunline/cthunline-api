import { FastifyInstance, FastifyRequest } from 'fastify';
import FastifyStatic from '@fastify/static';
import path from 'path';

import { configurationController } from './configurationController.js';
import { registrationController } from './registrationController.js';
import { characterController } from './characterController.js';
import { sessionController } from './sessionController.js';
import { sketchController } from './sketchController.js';
import { assetController } from './assetController.js';
import { authController } from './authController.js';
import { userController } from './userController.js';
import { gameController } from './gameController.js';
import { noteController } from './noteController.js';

import { authMiddleware } from './helpers/auth.js';
import { assetDir } from './helpers/asset.js';

import { importMetaUrlDirname } from '../services/tools.js';
import { getFastifyHttpMethods } from '../services/api.js';
import { NotFoundError } from '../services/errors.js';
import { getEnv } from '../services/env.js';
import { log } from '../services/log.js';

const dirname = importMetaUrlDirname(import.meta.url);

export const mainController = async (app: FastifyInstance) => {
    app.decorateRequest('user', null);

    app.addHook('onRequest', async (req: FastifyRequest) => {
        // public routes
        if (
            (req.method === 'GET' && req.url === '/api/configuration') || // public configuration route
            (req.method === 'POST' && req.url === '/api/auth') || // api login route is public
            (req.method === 'POST' && req.url === '/api/register') // registration route is public
        ) {
            return;
        }
        if (
            // api routes and static ressource are protected
            req.url.startsWith('/api') ||
            req.url.startsWith('/static')
        ) {
            // apply authentication middleware on private routes
            await authMiddleware(req);
        }
    });

    // apply api controllers
    await Promise.all(
        [
            assetController,
            authController,
            characterController,
            configurationController,
            gameController,
            noteController,
            sessionController,
            sketchController,
            registrationController,
            userController
        ].map((controller) =>
            app.register(controller, {
                prefix: '/api'
            })
        )
    );

    // throw 404 on unknown api routes
    app.all('/api/*', () => {
        throw new NotFoundError('Route does not exist');
    });

    // serve static assets
    await app.register(FastifyStatic, {
        root: assetDir,
        prefix: '/static'
    });

    // serve web client build in production
    if (getEnv('ENVIRONMENT') === 'prod') {
        log.info('Serving production web client build');
        await app.register(FastifyStatic, {
            root: path.join(dirname, '../web'),
            decorateReply: false,
            index: 'index.html'
        });
    } else {
        // any other request falls in 404
        app.route({
            method: getFastifyHttpMethods({ exclude: 'OPTIONS' }),
            url: '*',
            handler: () => {
                throw new NotFoundError();
            }
        });
    }
};
