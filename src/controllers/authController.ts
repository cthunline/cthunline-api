import {
    Router,
    Request,
    Response,
    NextFunction
} from 'express';
import DaysJs from 'dayjs';
import { nanoid } from 'nanoid';
import { Token } from '@prisma/client';

import { Prisma } from '../services/prisma';
import Validator from '../services/validator';
import {
    AuthenticationError,
    ForbiddenError,
    InternError
} from '../services/errors';
import { verifyPassword } from '../services/tools';

import AuthSchemas from './schemas/auth.json';

const validateLogin = Validator(AuthSchemas.login);

declare global {
    namespace Express {
        export interface Request {
            token: Token;
        }
    }
}

// get new limit date for token
const getTokenLimitDate = () => (
    DaysJs().add(3, 'hour').toDate()
);

// get expire date for cookie
const getCookieExpireDate = () => (
    DaysJs().add(3, 'day').toDate()
);

// express middleware controling bearer token validity
// injects token data in express request object
export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { bearer } = req.signedCookies;
        if (!bearer) {
            throw new AuthenticationError();
        }
        const token = await Prisma.token.findFirst({
            where: {
                bearer,
                limit: {
                    gt: new Date()
                }
            }
        });
        if (!token) {
            throw new AuthenticationError();
        }
        // this is intentionally not awaited so auth middleware is not slowed down
        Prisma.token.update({
            data: {
                limit: getTokenLimitDate()
            },
            where: {
                id: token.id
            }
        });
        req.token = token;
        next();
    } catch (err: any) {
        res.error(err);
    }
};

// control userId in params is same as authentified one
// if not throw forbidden error
export const controlSelf = (token: Token, userId: string) => {
    if (userId !== token.userId) {
        throw new ForbiddenError();
    }
};

// check currently authenticated user is an admin
export const controlSelfAdmin = async ({ userId }: Token) => {
    const user = await Prisma.user.findUnique({
        where: {
            id: userId
        }
    });
    if (!user) {
        throw new InternError(`Authenticated user ${userId} not found`);
    }
    if (!user.isAdmin) {
        throw new ForbiddenError();
    }
};

const authController = Router();

// check authentication validity
authController.get('/auth', async (req: Request, res: Response): Promise<void> => {
    try {
        res.send(req.token);
    } catch (err: any) {
        res.error(err);
    }
});

// login
authController.post('/auth', async ({ body }: Request, res: Response): Promise<void> => {
    try {
        validateLogin(body);
        const { email, password } = body;
        const user = await Prisma.user.findFirst({
            where: {
                email,
                isEnabled: true
            }
        });
        if (!user) {
            throw new AuthenticationError();
        }
        const {
            id: userId,
            password: hash
        } = user;
        const verified = await verifyPassword(password, hash);
        if (!verified) {
            throw new AuthenticationError();
        }
        const bearer = nanoid(50);
        const limit = getTokenLimitDate();
        const token = await Prisma.token.create({
            data: {
                userId,
                bearer,
                limit
            }
        });
        res.cookie('bearer', token.bearer, {
            httpOnly: true,
            signed: true,
            secure: process.env.COOKIE_SECURE === 'true',
            expires: getCookieExpireDate()
        }).json(token);
    } catch (err: any) {
        res.error(err);
    }
});

// logout
authController.delete('/auth', async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, bearer } = req.token;
        await Prisma.token.deleteMany({
            where: {
                userId,
                bearer
            }
        });
        res.clearCookie('bearer').send({});
    } catch (err: any) {
        res.error(err);
    }
});

export default authController;
