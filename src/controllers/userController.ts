import { Router, Request, Response } from 'express';

import { verifyPassword, hashPassword } from '../services/crypto';
import { controlSelf, controlSelfAdmin } from './helpers/auth';
import { ValidationError } from '../services/errors';
import { parseParamId } from '../services/tools';
import Validator from '../services/validator';
import { Prisma } from '../services/prisma';
import {
    userSelect,
    getUser,
    controlAdminFields,
    controlUniqueEmail,
    controlLocale,
    defaultUserData
} from './helpers/user';

import userSchemas from './schemas/user.json';

const validateCreateUser = Validator(userSchemas.create);
const validateUpdateUser = Validator(userSchemas.update);

const userController = Router();

// get all users
userController.get(
    '/users',
    async ({ query }: Request, res: Response): Promise<void> => {
        try {
            const getDisabled = query.disabled === 'true';
            const users = await Prisma.user.findMany({
                select: userSelect,
                where: getDisabled
                    ? {}
                    : {
                          isEnabled: true
                      }
            });
            res.json({ users });
        } catch (err: any) {
            res.error(err);
        }
    }
);

// create a user
userController.post(
    '/users',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { body } = req;
            controlSelfAdmin(req);
            validateCreateUser(body);
            await controlUniqueEmail(body.email);
            if (body.locale) {
                controlLocale(body.locale);
            }
            const hashedPassword = await hashPassword(body.password);
            const { password, ...cleanBody } = body;
            const user = await Prisma.user.create({
                select: userSelect,
                data: {
                    ...defaultUserData,
                    ...cleanBody,
                    password: hashedPassword
                }
            });
            res.json(user);
        } catch (err: any) {
            res.error(err);
        }
    }
);

// get a user
userController.get(
    '/users/:userId',
    async ({ params }: Request, res: Response): Promise<void> => {
        try {
            const userId = parseParamId(params, 'userId');
            const user = await getUser(userId);
            res.json(user);
        } catch (err: any) {
            res.error(err);
        }
    }
);

// edit user
userController.post(
    '/users/:userId',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { params, body } = req;
            const userId = parseParamId(params, 'userId');
            const user = await Prisma.user.findUniqueOrThrow({
                where: {
                    id: userId
                }
            });
            try {
                controlSelfAdmin(req);
            } catch (err) {
                controlSelf(req, userId);
                controlAdminFields(body);
            }
            validateUpdateUser(body);
            if (body.locale) {
                controlLocale(body.locale);
            }
            const data = { ...body };
            if (body.password) {
                if (!body.oldPassword) {
                    throw new ValidationError('Missing old password');
                }
                const verified = await verifyPassword(
                    body.oldPassword,
                    user.password
                );
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
    }
);

export default userController;
