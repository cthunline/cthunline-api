import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { verifyPassword, hashPassword } from '../services/crypto.js';
import {
    controlSelf,
    controlAdmin,
    controlAdminMiddleware
} from './helpers/auth.js';
import { ValidationError } from '../services/errors.js';
import { parseParamId } from '../services/api.js';
import { prisma } from '../services/prisma.js';
import {
    safeUserSelect,
    getUser,
    controlAdminFields,
    controlUniqueEmail,
    controlLocale,
    defaultUserData
} from './helpers/user.js';

import { QueryParam } from '../types/api.js';

import {
    createUserSchema,
    CreateUserBody,
    updateUserSchema,
    UpdateUserBody
} from './schemas/user.js';

export const userController = async (app: FastifyInstance) => {
    // get all users
    app.route({
        method: 'GET',
        url: '/users',
        handler: async (
            {
                query
            }: FastifyRequest<{
                Querystring: {
                    disabled?: QueryParam;
                };
            }>,
            rep: FastifyReply
        ) => {
            const getDisabled = query.disabled === 'true';
            const users = await prisma.user.findMany({
                select: safeUserSelect,
                where: getDisabled
                    ? {}
                    : {
                          isEnabled: true
                      }
            });
            rep.send({ users });
        }
    });

    // create a user
    app.route({
        method: 'POST',
        url: '/users',
        schema: { body: createUserSchema },
        onRequest: controlAdminMiddleware,
        handler: async (
            {
                body
            }: FastifyRequest<{
                Body: CreateUserBody;
            }>,
            rep: FastifyReply
        ) => {
            await controlUniqueEmail(body.email);
            if (body.locale) {
                controlLocale(body.locale);
            }
            const hashedPassword = await hashPassword(body.password);
            const { password, ...cleanBody } = body;
            const createdUser = await prisma.user.create({
                select: safeUserSelect,
                data: {
                    ...defaultUserData,
                    ...cleanBody,
                    password: hashedPassword
                }
            });
            rep.send(createdUser);
        }
    });

    // get a user
    app.route({
        method: 'GET',
        url: '/users/:userId',
        handler: async (
            {
                params
            }: FastifyRequest<{
                Params: {
                    userId: string;
                };
            }>,
            rep: FastifyReply
        ) => {
            const userId = parseParamId(params, 'userId');
            const user = await getUser(userId);
            rep.send(user);
        }
    });

    // edit user
    app.route({
        method: 'POST',
        url: '/users/:userId',
        schema: { body: updateUserSchema },
        handler: async (
            {
                params,
                body,
                user: reqUser
            }: FastifyRequest<{
                Params: {
                    userId: string;
                };
                Body: UpdateUserBody;
            }>,
            rep: FastifyReply
        ) => {
            const userId = parseParamId(params, 'userId');
            try {
                controlAdmin(reqUser);
            } catch (err) {
                controlSelf(userId, reqUser);
                controlAdminFields<UpdateUserBody>(body);
            }
            const userData = await prisma.user.findUniqueOrThrow({
                where: {
                    id: userId
                }
            });
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
                    userData.password
                );
                if (!verified) {
                    throw new ValidationError('Old password is not valid');
                }
                data.password = await hashPassword(body.password);
                delete data.oldPassword;
            }
            const updatedUser = await prisma.user.update({
                select: safeUserSelect,
                data,
                where: {
                    id: userData.id
                }
            });
            rep.send(updatedUser);
        }
    });
};
