import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

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
import { userIdParamSchema } from './schemas/params.js';
import { disabledQuerySchema } from './schemas/query.js';
import { createUserSchema, updateUserSchema } from './schemas/user.js';

export const userController: FastifyPluginAsyncTypebox = async (app) => {
    // biome-ignore lint/suspicious/useAwait: fastify controllers require async

    // get all users
    app.route({
        method: 'GET',
        url: '/users',
        schema: {
            querystring: disabledQuerySchema
        },
        handler: async ({ query: { disabled } }, rep) => {
            const users = await getUsers(disabled);
            rep.send({ users });
        }
    });

    // create a user
    app.route({
        method: 'POST',
        url: '/users',
        schema: { body: createUserSchema },
        onRequest: controlAdminMiddleware,
        handler: async ({ body }, rep) => {
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
            params: userIdParamSchema
        },
        handler: async ({ params: { userId } }, rep) => {
            const user = await getUserByIdOrThrow(userId);
            rep.send(user);
        }
    });

    // edit user
    app.route({
        method: 'PATCH',
        url: '/users/:userId',
        schema: {
            params: userIdParamSchema,
            body: updateUserSchema
        },
        handler: async ({ params: { userId }, body, user: reqUser }, rep) => {
            try {
                controlAdmin(reqUser);
            } catch {
                controlSelf(userId, reqUser);
                controlAdminFields(body);
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
