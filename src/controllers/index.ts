import {
    Router,
    Request,
    Response,
    NextFunction
} from 'express';

import { NotFoundError } from '../services/errors';
import authRouter, { authMiddleware } from './auth';
import userRouter from './user';
import sessionRouter from './session';
import characterRouter from './character';

const apiRouter = Router();

// apply authentication middleware to all routes except login
apiRouter.use(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method === 'POST' && req.path === '/auth') {
        next();
    } else {
        await authMiddleware(req, res, next);
    }
});

// apply routers
apiRouter.use(authRouter);
apiRouter.use(userRouter);
apiRouter.use(sessionRouter);
apiRouter.use(characterRouter);

// throw 404 on unknown routes
apiRouter.use('*', (req: Request, res: Response) => {
    res.error(
        new NotFoundError('Route does not exist')
    );
});

export default apiRouter;
