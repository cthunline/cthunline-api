import { FastifyInstance, FastifyRequest } from 'fastify';
import FastifyStatic from '@fastify/static';
import Path from 'path';

import configurationController from './configurationController';
import registrationController from './registrationController';
import characterController from './characterController';
import sessionController from './sessionController';
import sketchController from './sketchController';
import assetController from './assetController';
import authController from './authController';
import userController from './userController';
import gameController from './gameController';
import noteController from './noteController';

import { authMiddleware } from './helpers/auth';
import { assetDir } from './helpers/asset';

import { getFastifyHttpMethods } from '../services/api';
import { NotFoundError } from '../services/errors';
import { getEnv } from '../services/env';
import Log from '../services/log';

const mainController = async (app: FastifyInstance) => {
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
        Log.info('Serving production web client build');
        await app.register(FastifyStatic, {
            root: Path.join(__dirname, '../web'),
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

export default mainController;
