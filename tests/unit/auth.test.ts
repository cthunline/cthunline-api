import type { FastifyRequest } from 'fastify';
import { describe, expect, test } from 'vitest';

import {
    controlAdmin,
    controlAdminMiddleware,
    controlSelf
} from '../../src/controllers/helpers/auth.js';
import type { SafeUser, User } from '../../src/drizzle/schema.js';
import {
    generateJwt,
    hashPassword,
    verifyJwt,
    verifyPassword
} from '../../src/services/crypto.js';
import {
    AuthenticationError,
    ForbiddenError
} from '../../src/services/errors.js';
import { users } from '../functional/data/users.data.js';
import { expectAsync } from '../functional/helpers/assert.helper.js';

type FakeMiddlewareType = (req: object) => Promise<void>;

describe('[Unit] Auth', () => {
    describe('hashPassword + verifyPassword', () => {
        test('Should hash and verify password', async () => {
            const strings = [
                'az9r5t4qz9ret4bc123',
                '987f8r4tqe95rt4qe98r4gh',
                '123654654987',
                'azeqsfzret'
            ];
            await Promise.all(
                strings.map((string) =>
                    (async () => {
                        const hash = await hashPassword(string);
                        expect(await verifyPassword(string, hash)).toEqual(
                            true
                        );
                    })()
                )
            );
        });
    });

    describe('generateJwt + verifyJwt', () => {
        test('Should generate and verify a JWT', async () => {
            const { password, ...user } = users[0];
            const jwt = generateJwt(user as SafeUser);
            const { exp, iat, ...decoded } = verifyJwt(jwt);
            expect(decoded).toEqual(user);
            expect(exp).to.be.a('number');
            expect(iat).to.be.a('number');
            expect(() => verifyJwt('invalidJwt')).to.throw(AuthenticationError);
        });
    });

    describe('controlSelf', () => {
        test('Should control request user match userId', async () => {
            const id = 123;
            expect(() => controlSelf(id, { id } as User)).to.not.throw();
            expect(() => controlSelf(999, { id } as User)).to.throw(
                ForbiddenError
            );
        });
    });

    describe('controlAdmin', () => {
        test('Should control request user is an admin', async () => {
            const adminUser = { isAdmin: true } as User;
            const notAdminUser = { isAdmin: false } as User;
            expect(() => controlAdmin(adminUser)).to.not.throw();
            expect(() => controlAdmin(notAdminUser)).to.throw(ForbiddenError);
        });
    });

    describe('controlAdminMiddleware', () => {
        test('Should control request user is an admin', async () => {
            const reqAdmin = { user: { isAdmin: true } };
            const reqNotAdmin = { user: { isAdmin: false } };
            await expectAsync(
                (controlAdminMiddleware as FakeMiddlewareType)(
                    reqAdmin as FastifyRequest
                )
            );
            await expectAsync(
                (controlAdminMiddleware as FakeMiddlewareType)(
                    reqNotAdmin as FastifyRequest
                ),
                ForbiddenError
            );
        });
    });
});
