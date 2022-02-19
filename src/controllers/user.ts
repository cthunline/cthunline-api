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
import { controlSelf, controlSelfAdmin } from './auth';
import { hashPassword } from '../services/tools';
import { ConflictError } from '../services/errors';
import Validator from '../services/validator';

import UserSchemas from './schemas/user.json';

const validateCreate = Validator(UserSchemas.create);
const validateUpdate = Validator(UserSchemas.update);

export type UserSelect = Omit<User, 'password'>;

// prisma select object to exclude password in returned data
const userSelect = {
    id: true,
    name: true,
    email: true,
    isAdmin: true,
    createdAt: true,
    updatedAt: true
};

// check a user exists and return it
// returned user data will not contain password
export const findUser = async (userId: string): Promise<UserSelect> => (
    handleNotFound<UserSelect>(
        'User', (
            Prisma.user.findUnique({
                select: userSelect,
                where: {
                    id: userId
                }
            })
        )
    )
);

const userRouter = Router();

// get all users
userRouter.get('/users', async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await Prisma.user.findMany({
            select: userSelect
        });
        res.json({ users });
    } catch (err: any) {
        res.error(err);
    }
});

// create a user
userRouter.post('/users', async ({ body, token }: Request, res: Response): Promise<void> => {
    try {
        await controlSelfAdmin(token);
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

// get a user
userRouter.get('/users/:userId', async ({ params }: Request, res: Response): Promise<void> => {
    try {
        const { userId } = params;
        const user = await findUser(userId);
        res.json(user);
    } catch (err: any) {
        res.error(err);
    }
});

// edit user
userRouter.post('/users/:userId', async ({ params, body, token }: Request, res: Response): Promise<void> => {
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
        try {
            await controlSelfAdmin(token);
        } catch (err) {
            // only admins can set the admin flag to true
            if (body.isAdmin === true) {
                throw err;
            }
            controlSelf(token, userId);
        }
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
