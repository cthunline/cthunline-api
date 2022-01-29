import {
    Router,
    Request,
    Response
} from 'express';
import { User } from '@prisma/client';
import {
    Prisma,
    handleNotFound
} from '../services/prisma';
import { hashPassword } from '../services/tools';
import { ConflictError } from '../services/errors';
import Validator from '../services/validator';
import UserSchemas from './schemas/user.json';

const validateCreate = Validator(UserSchemas.create);
const validateUpdate = Validator(UserSchemas.update);

export type UserSelect = Omit<User, 'password'>;

const userSelect = {
    id: true,
    name: true,
    email: true,
    createdAt: true,
    updatedAt: true
};

const userRouter = Router();

userRouter.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await Prisma.user.findMany({
            select: userSelect
        });
        res.json({ users });
    } catch (err: any) {
        res.error(err);
    }
});

userRouter.post('/', async ({ body }: Request, res: Response): Promise<void> => {
    try {
        validateCreate(body);
        const checkEmail = await Prisma.user.findUnique({
            where: {
                email: body.email
            }
        });
        if (checkEmail) {
            throw new ConflictError(`Email ${body.email} already taken`);
        }
        const password = await hashPassword(body.password);
        const data = {
            ...body,
            password
        };
        const user = await Prisma.user.create({
            select: userSelect,
            data
        });
        res.json(user);
    } catch (err: any) {
        res.error(err);
    }
});

userRouter.get('/:userId', async ({ params }: Request, res: Response): Promise<void> => {
    try {
        const { userId } = params;
        const user = await handleNotFound<UserSelect>(
            'User', (
                Prisma.user.findUnique({
                    select: userSelect,
                    where: {
                        id: userId
                    }
                })
            )
        );
        res.json(user);
    } catch (err: any) {
        res.error(err);
    }
});

userRouter.post('/:userId', async ({ params, body }: Request, res: Response): Promise<void> => {
    try {
        const { userId } = params;
        const user = await handleNotFound<User>(
            'User', (
                Prisma.user.findUnique({
                    where: {
                        id: userId
                    }
                })
            )
        );
        validateUpdate(body);
        const data = { ...body };
        if (body.password) {
            data.password = await hashPassword(body.password);
        }
        const updatedUser = await Prisma.user.update({
            select: userSelect,
            data,
            where: {
                id: user.id
            }
        });
        res.json(updatedUser);
    } catch (err: any) {
        res.error(err);
    }
});

export default userRouter;
