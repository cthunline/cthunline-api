import {
    Router,
    Request,
    Response,
    NextFunction
} from 'express';
import { NotFoundError } from '../services/errors';
import authRouter, { authMiddleware } from './auth';
import userRouter from './user';
import gameRouter from './game';

const apiRouter = Router();

apiRouter.use(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method === 'POST' && req.path === '/auth') {
        next();
    } else {
        await authMiddleware(req, res, next);
    }
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/games', gameRouter);

apiRouter.use('*', (req: Request, res: Response) => {
    res.error(
        new NotFoundError('Route does not exist')
    );
});

export default apiRouter;
