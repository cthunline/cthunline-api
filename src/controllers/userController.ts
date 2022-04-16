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
import {
    controlSelf,
    controlSelfAdmin,
    verifyPassword,
    hashPassword
} from '../services/auth';
import { ConflictError, ValidationError } from '../services/errors';
import Validator from '../services/validator';
import {
    userSelect,
    getUser,
    controlAdminFields
} from '../services/user';

import UserSchemas from './schemas/user.json';

const validateCreateUser = Validator(UserSchemas.create);
const validateUpdateUser = Validator(UserSchemas.update);

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
userController.post('/users', async (req: Request, res: Response): Promise<void> => {
    try {
        const { body } = req;
        controlSelfAdmin(req);
        validateCreateUser(body);
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
        const user = await getUser(userId);
        res.json(user);
    } catch (err: any) {
        res.error(err);
    }
});

// edit user
userController.post('/users/:userId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { params, body } = req;
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
            controlSelfAdmin(req);
        } catch (err) {
            controlSelf(req, userId);
            controlAdminFields(body);
        }
        validateUpdateUser(body);
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
