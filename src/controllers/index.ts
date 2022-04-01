import Express, {
    Router,
    Request,
    Response,
    NextFunction
} from 'express';

import { NotFoundError } from '../services/errors';
import authController, { authMiddleware } from './authController';
import userController from './userController';
import assetController, { assetDir } from './assetController';
import gameController from './gameController';
import sessionController from './sessionController';
import characterController from './characterController';

const apiController = Router();

// apply authentication middleware
apiController.use(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if ((
        req.method === 'POST' && req.path === '/api/auth' // exception for login route
    ) || (
        req.method === 'GET' && req.path.startsWith('/static/') // exception for static assets
    )) {
        next();
    } else {
        await authMiddleware(req, res, next);
    }
});

// apply api controllers
apiController.use('/api', authController);
apiController.use('/api', userController);
apiController.use('/api', assetController);
apiController.use('/api', gameController);
apiController.use('/api', sessionController);
apiController.use('/api', characterController);

// serve static assets
apiController.use('/static', Express.static(assetDir));

// throw 404 on unknown routes
apiController.use('*', (req: Request, res: Response) => {
    res.error(
        new NotFoundError('Route does not exist')
    );
});

export default apiController;
