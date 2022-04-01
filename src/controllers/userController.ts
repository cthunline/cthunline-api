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
import { controlSelf, controlSelfAdmin } from './authController';
import { verifyPassword, hashPassword } from '../services/tools';
import {
    ConflictError,
    ValidationError,
    ForbiddenError
} from '../services/errors';
import Validator from '../services/validator';

import UserSchemas from './schemas/user.json';

const validateCreate = Validator(UserSchemas.create);
const validateUpdate = Validator(UserSchemas.update);

export type UserSelect = Omit<User, 'password'>;

// prisma select object to exclude password in returned data
export const userSelect = {
    id: true,
    name: true,
    email: true,
    isAdmin: true,
    isEnabled: true,
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

// throws forbidden error if any of the admin fields exists in the user edit body
export const controlAdminFields = (body: object) => {
    const adminFields = ['isAdmin', 'isEnabled'];
    for (const field of adminFields) {
        if (Object.hasOwn(body, field)) {
            throw new ForbiddenError();
        }
    }
};

const userController = Router();

// get all users
userController.get('/users', async ({ query }: Request, res: Response): Promise<void> => {
    try {
        const getDisabled = query.disabled === 'true';
        const users = await Prisma.user.findMany({
            select: userSelect,
            where: getDisabled ? {} : {
                isEnabled: true
            }
        });
        res.json({ users });
    } catch (err: any) {
        res.error(err);
    }
});

// create a user
userController.post('/users', async ({ body, token }: Request, res: Response): Promise<void> => {
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
userController.get('/users/:userId', async ({ params }: Request, res: Response): Promise<void> => {
    try {
        const { userId } = params;
        const user = await findUser(userId);
        res.json(user);
    } catch (err: any) {
        res.error(err);
    }
});

// edit user
userController.post('/users/:userId', async ({ params, body, token }: Request, res: Response): Promise<void> => {
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
            controlSelf(token, userId);
            controlAdminFields(body);
        }
        validateUpdate(body);
        const data = { ...body };
        if (body.password) {
            if (!body.oldPassword) {
                throw new ValidationError('Missing old password');
            }
            const verified = await verifyPassword(body.oldPassword, user.password);
            if (!verified) {
                throw new ValidationError('Old password is not valid');
            }
            data.password = await hashPassword(body.password);
            delete data.oldPassword;
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

export default userController;
