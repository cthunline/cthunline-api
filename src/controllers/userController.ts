import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { cache } from '../services/cache.js';
import { hashPassword, verifyPassword } from '../services/crypto.js';
import { ValidationError } from '../services/errors.js';
import {
    createUser,
    getUnsafeUserByIdOrThrow,
    getUserByIdOrThrow,
    getUsers,
    updateUserById
} from '../services/queries/user.js';
import type { QueryParam } from '../types/api.js';
import {
    type CacheJwtData,
    controlAdmin,
    controlAdminMiddleware,
    controlSelf,
    getJwtCacheKey
} from './helpers/auth.js';
import {
    controlAdminFields,
    controlLocale,
    controlUniqueEmail,
    defaultUserData
} from './helpers/user.js';
import { type UserIdParams, userIdSchema } from './schemas/params.js';
import {
    type CreateUserBody,
    type UpdateUserBody,
    createUserSchema,
    updateUserSchema
} from './schemas/user.js';

export const userController = async (app: FastifyInstance) => {
    // biome-ignore lint/suspicious/useAwait: fastify controllers require async

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
        schema: {
            params: userIdSchema
        },
        handler: async (
            {
                params: { userId }
            }: FastifyRequest<{
                Params: UserIdParams;
            }>,
            rep: FastifyReply
        ) => {
            const user = await getUserByIdOrThrow(userId);
            rep.send(user);
        }
    });

    // edit user
    app.route({
        method: 'PATCH',
        url: '/users/:userId',
        schema: {
            params: userIdSchema,
            body: updateUserSchema
        },
        handler: async (
            {
                params: { userId },
                body,
                user: reqUser
            }: FastifyRequest<{
                Params: UserIdParams;
                Body: UpdateUserBody;
            }>,
            rep: FastifyReply
        ) => {
            try {
                controlAdmin(reqUser);
            } catch {
                controlSelf(userId, reqUser);
                controlAdminFields<UpdateUserBody>(body);
            }
            const userData = await getUnsafeUserByIdOrThrow(userId);
            if (body.locale) {
                controlLocale(body.locale);
            }
            const { oldPassword, ...data } = { ...body };
            if (body.password) {
                if (!oldPassword) {
                    throw new ValidationError('Missing old password');
                }
                const verified = await verifyPassword(
                    oldPassword,
                    userData.password
                );
                if (!verified) {
                    throw new ValidationError('Old password is not valid');
                }
                data.password = await hashPassword(body.password);
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
