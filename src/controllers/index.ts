import Express, {
    Router,
    Request,
    Response,
    NextFunction
} from 'express';

import { NotFoundError } from '../services/errors';
import authRouter, { authMiddleware } from './auth';
import userRouter from './user';
import assetRouter, { assetDir } from './asset';
import gameRouter from './game';
import sessionRouter from './session';
import characterRouter from './character';

const apiRouter = Router();

// apply authentication middleware
apiRouter.use(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

// apply api routers
apiRouter.use('/api', authRouter);
apiRouter.use('/api', userRouter);
apiRouter.use('/api', assetRouter);
apiRouter.use('/api', gameRouter);
apiRouter.use('/api', sessionRouter);
apiRouter.use('/api', characterRouter);

// serve static assets
apiRouter.use('/static', Express.static(assetDir));

// throw 404 on unknown routes
apiRouter.use('*', (req: Request, res: Response) => {
    res.error(
        new NotFoundError('Route does not exist')
    );
});

export default apiRouter;
