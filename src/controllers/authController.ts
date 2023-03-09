import {
    Router,
    Request,
    Response,
    NextFunction
} from 'express';

import { AuthenticationError } from '../services/errors';
import { getCookieOptions } from './helpers/auth';
import rateLimiter from '../services/rateLimiter';
import Validator from '../services/validator';
import { Prisma } from '../services/prisma';
import { UserSelect } from '../types/user';
import {
    verifyPassword,
    generateJwt,
    verifyJwt
} from '../services/crypto';

import authSchemas from './schemas/auth.json';

const validateLogin = Validator(authSchemas.login);

// express middleware controling jwt validity
// injects user data in express request object
export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { token } = req.signedCookies;
        if (!token) {
            throw new AuthenticationError();
        }
        const user = verifyJwt<UserSelect>(token);
        req.user = user;
        next();
    } catch (err: any) {
        res.error(err);
    }
};

const authController = Router();

// check authentication validity
authController.get('/auth', async (req: Request, res: Response): Promise<void> => {
    try {
        res.send(req.user);
    } catch (err: any) {
        res.error(err);
    }
});

// login
authController.post('/auth', rateLimiter, async ({ body }: Request, res: Response): Promise<void> => {
    try {
        validateLogin(body);
        const { email, password } = body;
        const userWithPassword = await Prisma.user.findFirst({
            where: {
                email,
                isEnabled: true
            }
        });
        if (!userWithPassword) {
            throw new AuthenticationError();
        }
        const { password: hash, ...user } = userWithPassword;
        const verified = await verifyPassword(password, hash);
        if (!verified) {
            throw new AuthenticationError();
        }
        const token = generateJwt<UserSelect>(user);
        res.cookie(
            'token',
            token,
            getCookieOptions()
        ).json(user);
    } catch (err: any) {
        res.error(err);
    }
});

// logout
authController.delete('/auth', async (_req: Request, res: Response): Promise<void> => {
    try {
        res.clearCookie('token').send({});
    } catch (err: any) {
        res.error(err);
    }
});

export default authController;
