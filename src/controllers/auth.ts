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
import { AuthenticationError } from '../services/errors';
import AuthSchemas from './schemas/auth.json';
import { verifyPassword } from '../services/tools';

const validateLogin = Validator(AuthSchemas.login);

declare global {
    namespace Express {
        export interface Request {
            token: Token;
        }
    }
}

const getBearer = (req: Request): string | null => {
    const bearerPrefix = 'Bearer ';
    const authHeader = req.get('Authorization');
    if (authHeader && authHeader.startsWith(bearerPrefix)) {
        return authHeader.replace(bearerPrefix, '');
    }
    return null;
};

const verifyToken = async (bearer: string): Promise<Token> => {
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
    return token;
};

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const bearer = getBearer(req);
        if (!bearer) {
            throw new AuthenticationError();
        }
        const token = await verifyToken(bearer);
        req.token = token;
        next();
    } catch (err: any) {
        res.error(err);
    }
};

const authRouter = Router();

authRouter.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        res.send(req.token);
    } catch (err: any) {
        res.error(err);
    }
});

authRouter.post('/', async ({ body }: Request, res: Response): Promise<void> => {
    try {
        validateLogin(body);
        const { email, password } = body;
        const user = await Prisma.user.findFirst({
            where: { email }
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
        const limit = DaysJs().add(3, 'hour').toDate();
        const token = await Prisma.token.create({
            data: {
                userId,
                bearer,
                limit
            }
        });
        res.json(token);
    } catch (err: any) {
        res.error(err);
    }
});

authRouter.delete('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, bearer } = req.token;
        await Prisma.token.delete({
            where: {
                userId_bearer: {
                    userId,
                    bearer
                }
            }
        });
        res.send({});
    } catch (err: any) {
        res.error(err);
    }
});

export default authRouter;
