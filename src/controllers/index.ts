import path from 'node:path';
import FastifyStatic from '@fastify/static';
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { assetController } from './assetController.js';
import { authController } from './authController.js';
import { characterController } from './characterController.js';
import { configurationController } from './configurationController.js';
import { gameController } from './gameController.js';
import { noteController } from './noteController.js';
import { registrationController } from './registrationController.js';
import { sessionController } from './sessionController.js';
import { sketchController } from './sketchController.js';
import { statsController } from './statsController.js';
import { userController } from './userController.js';

import { assetDir } from './helpers/asset.js';
import { authMiddleware } from './helpers/auth.js';

import { getEnv } from '../services/env.js';
import { NotFoundError } from '../services/errors.js';
import { log } from '../services/log.js';
import { importMetaUrlDirname } from '../services/tools.js';

const dirname = importMetaUrlDirname(import.meta.url);

export const mainController: FastifyPluginAsyncTypebox = async (app) => {
    app.decorateRequest('user', null);

    app.addHook('onRequest', async (req) => {
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
            statsController,
            registrationController,
            userController
        ].map((controller) =>
            app.register(controller, {
                prefix: '/api'
            })
        )
    );

    const isProd = getEnv('NODE_ENV') === 'production';

    // serve static assets
    await app.register(FastifyStatic, {
        root: assetDir,
        prefix: '/static/',
        decorateReply: !isProd
    });

    // serve web client build assets in production
    if (isProd) {
        log.info('Serving production web client build');
        await app.register(FastifyStatic, {
            root: path.join(dirname, '../web'),
            prefix: '/',
            decorateReply: true
        });
    }

    // not found requests
    app.setNotFoundHandler((req, res) => {
        const { url } = req.raw;
        if (url?.startsWith('/api')) {
            // not found api routes
            throw new NotFoundError('API route does not exist');
        }
        if (isProd) {
            // serve web client build assets in production
            res.sendFile('index.html');
        } else {
            // fallback
            throw new NotFoundError();
        }
    });
};
