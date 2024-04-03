import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { verifyPassword, hashPassword } from '../services/crypto.js';
import { ValidationError } from '../services/errors.js';
import { parseParamId } from '../services/api.js';
import { QueryParam } from '../types/api.js';
import { cache } from '../services/cache.js';
import {
    createUser,
    getUnsafeUserByIdOrThrow,
    getUserByIdOrThrow,
    getUsers,
    updateUserById
} from '../services/queries/user.js';
import {
    controlSelf,
    controlAdmin,
    controlAdminMiddleware,
    CacheJwtData,
    getJwtCacheKey
} from './helpers/auth.js';
import {
    controlAdminFields,
    controlUniqueEmail,
    controlLocale,
    defaultUserData
} from './helpers/user.js';
import {
    createUserSchema,
    type CreateUserBody,
    updateUserSchema,
    type UpdateUserBody
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
            const users = await getUsers(getDisabled);
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
            const createdUser = await createUser({
                ...defaultUserData,
                ...cleanBody,
                password: hashedPassword
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
            const user = await getUserByIdOrThrow(userId);
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
            const userData = await getUnsafeUserByIdOrThrow(userId);
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
            const updatedUser = await updateUserById(userData.id, data);
            if (updatedUser.id === reqUser.id) {
                const cacheKey = getJwtCacheKey(updatedUser.id);
                const cacheJwtData =
                    await cache.getJson<CacheJwtData>(cacheKey);
                if (cacheJwtData) {
                    await cache.setJson<CacheJwtData>(cacheKey, {
                        ...cacheJwtData,
                        user: updatedUser
                    });
                }
            }
            rep.send(updatedUser);
        }
    });
};
