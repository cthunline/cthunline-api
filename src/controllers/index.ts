import {
    Router,
    Request,
    Response,
    NextFunction
} from 'express';
import { NotFoundError } from '../services/errors';
import authRouter, { authMiddleware } from './auth';
import userRouter from './user';

const router = Router();

router.use(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method === 'POST' && req.path === '/auth') {
        next();
    } else {
        await authMiddleware(req, res, next);
    }
});

router.use('/auth', authRouter);

router.use('/users', userRouter);

router.use('*', (req: Request, res: Response) => {
    res.error(
        new NotFoundError('Route does not exist')
    );
});

export default router;
