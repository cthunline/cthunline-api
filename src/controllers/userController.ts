import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';

import { verifyPassword, hashPassword } from '../services/crypto.js';
import { InternError, ValidationError } from '../services/errors.js';
import { parseParamId } from '../services/api.js';
import { db, tables } from '../services/db.js';
import { QueryParam } from '../types/api.js';
import { cache } from '../services/cache.js';
import {
    controlSelf,
    controlAdmin,
    controlAdminMiddleware,
    CacheJwtData,
    getJwtCacheKey
} from './helpers/auth.js';
import {
    safeUserSelect,
    getUserByIdOrThrow,
    controlAdminFields,
    controlUniqueEmail,
    controlLocale,
    defaultUserData,
    getUnsafeUserByIdOrThrow
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
            const users = await db
                .select(safeUserSelect)
                .from(tables.users)
                .where(
                    getDisabled ? undefined : eq(tables.users.isEnabled, true)
                );
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
            const createdUsers = await db
                .insert(tables.users)
                .values({
                    ...defaultUserData,
                    ...cleanBody,
                    password: hashedPassword
                })
                .returning(safeUserSelect);
            const createdUser = createdUsers[0];
            if (!createdUser) {
                throw new InternError('Could not retreive inserted user');
            }
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
            const updatedUsers = await db
                .update(tables.users)
                .set(data)
                .where(eq(tables.users.id, userData.id))
                .returning(safeUserSelect);
            const updatedUser = updatedUsers[0];
            if (!updatedUser) {
                throw new InternError('Could not retreive updated user');
            }
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
