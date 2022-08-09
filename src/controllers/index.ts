import Express, {
    Router,
    Request,
    Response,
    NextFunction
} from 'express';
import Path from 'path';

import { NotFoundError } from '../services/errors';
import Log from '../services/log';
import { configuration } from '../services/configuration';
import { assetDir } from '../services/controllerServices/asset';
import authController, { authMiddleware } from './authController';
import userController from './userController';
import registrationController from './registrationController';
import assetController from './assetController';
import gameController from './gameController';
import sessionController from './sessionController';
import noteController from './noteController';
import sketchController from './sketchController';
import characterController from './characterController';
import configurationController from './configurationController';

const { ENVIRONMENT } = configuration;

const mainController = Router();

// apply authentication middleware
mainController.use(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if ((
        req.method === 'GET' && req.path === '/api/configuration' // public configuration route
    ) || (
        req.method === 'POST' && req.path === '/api/auth' // api login route is public
    ) || (
        req.method === 'POST' && req.path === '/api/register' // registration route is public
    )) {
        next();
    } else if (req.path.startsWith('/api') || req.path.startsWith('/static')) { // api routes and static ressource are protected
        await authMiddleware(req, res, next);
    } else { // any other route is for client build
        next();
    }
});

// apply api controllers
mainController.use('/api', authController);
mainController.use('/api', userController);
mainController.use('/api', registrationController);
mainController.use('/api', assetController);
mainController.use('/api', gameController);
mainController.use('/api', sessionController);
mainController.use('/api', noteController);
mainController.use('/api', sketchController);
mainController.use('/api', characterController);
mainController.use('/api', configurationController);

// throw 404 on unknown api routes
mainController.use('/api/*', (_req: Request, res: Response) => {
    res.error(
        new NotFoundError('Route does not exist')
    );
});

// serve static assets
mainController.use('/static', Express.static(assetDir));

// serve client build in production
if (ENVIRONMENT === 'prod') {
    Log.info('Serving production client build');
    mainController.use(Express.static(
        Path.join(__dirname, '../client')
    ));
    mainController.get('*', (_req: Request, res: Response) => {
        res.sendFile('index.html', {
            root: Path.join(__dirname, '../client')
        });
    });
} else { // any other request falls in 404 if in dev mode
    mainController.use('*', (_req: Request, res: Response) => {
        res.error(new NotFoundError());
    });
}

export default mainController;
