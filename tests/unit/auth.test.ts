import { expect } from 'chai';
import { Request } from 'express';

import {
    hashPassword,
    verifyPassword,
    generateJwt,
    verifyJwt,
    controlSelf,
    controlSelfAdmin
} from '../../src/services/controllerServices/auth';
import {
    AuthenticationError,
    ForbiddenError
} from '../../src/services/errors';

describe('[Unit] Auth', () => {
    describe('hashPassword + verifyPassword', () => {
        it('Should hash and verify password', async () => {
            const strings = [
                'az9r5t4qz9ret4bc123',
                '987f8r4tqe95rt4qe98r4gh',
                '123654654987',
                'azeqsfzret'
            ];
            await Promise.all(
                strings.map((string) => (async () => {
                    const hash = await hashPassword(string);
                    expect(await verifyPassword(string, hash)).to.be.true;
                })())
            );
        });
    });

    describe('generateJwt + verifyJwt', () => {
        it('Should generate and verify a JWT', async () => {
            const data = {
                key1: 'value1',
                key2: 'value2'
            };
            const jwt = generateJwt(data);
            const {
                exp,
                iat,
                ...decoded
            } = verifyJwt(jwt);
            expect(decoded).to.deep.equal(data);
            expect(exp).to.be.a('number');
            expect(iat).to.be.a('number');
            expect(() => (
                verifyJwt('invalidJwt')
            )).to.throw(
                AuthenticationError
            );
        });
    });

    describe('controlSelf', () => {
        it('Should control request user match userId', async () => {
            const id = 123;
            const req = { user: { id } };
            expect(() => (
                controlSelf(req as Request, id)
            )).to.not.throw();
            expect(() => (
                controlSelf(req as Request, 999)
            )).to.throw(
                ForbiddenError
            );
        });
    });

    describe('controlSelfAdmin', () => {
        it('Should control request user is an admin', async () => {
            const reqAdmin = { user: { isAdmin: true } };
            const reqNotAdmin = { user: { isAdmin: false } };
            expect(() => (
                controlSelfAdmin(reqAdmin as Request)
            )).to.not.throw();
            expect(() => (
                controlSelfAdmin(reqNotAdmin as Request)
            )).to.throw(
                ForbiddenError
            );
        });
    });
});
