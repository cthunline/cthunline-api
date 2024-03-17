import { FastifyRequest } from 'fastify';
import { User } from '@prisma/client';
import { describe, test, expect } from 'vitest';

import {
    hashPassword,
    verifyPassword,
    generateJwt,
    verifyJwt
} from '../../src/services/crypto.js';
import {
    AuthenticationError,
    ForbiddenError
} from '../../src/services/errors.js';
import {
    controlSelf,
    controlAdmin,
    controlSelfMiddleware,
    controlAdminMiddleware
} from '../../src/controllers/helpers/auth.js';

import { SafeUser } from '../../src/types/user.js';

import { expectAsync } from '../functional/helpers/assert.helper.js';

import users from '../functional/data/users.json';

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

    describe('controlSelfMiddleware', () => {
        test('Should control request user match userId', async () => {
            const id = 123;
            await expectAsync(
                controlSelfMiddleware({
                    user: { id },
                    params: { userId: id.toString() }
                } as FastifyRequest<{ Params: { userId: string } }>)
            );
            await expectAsync(
                controlSelfMiddleware({
                    user: { id },
                    params: { userId: '999' }
                } as FastifyRequest<{ Params: { userId: string } }>),
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
                controlAdminMiddleware(reqAdmin as FastifyRequest)
            );
            await expectAsync(
                controlAdminMiddleware(reqNotAdmin as FastifyRequest),
                ForbiddenError
            );
        });
    });
});
