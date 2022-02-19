import { expect } from 'chai';

import Api from '../../helpers/api.helper';
import Data from '../../helpers/data.helper';
import { assertUser } from '../../helpers/assert.helper';

import usersData from '../../data/users.json';

describe('[API] Users', () => {
    before(async () => {
        await Data.reset();
    });
    beforeEach(async () => {
        await Api.login();
    });

    describe('GET /users', () => {
        it('Should list all users', async () => {
            await Api.testGetList({
                route: '/users',
                listKey: 'users',
                data: usersData,
                assert: assertUser
            });
        });
    });

    describe('POST /users', () => {
        it('Should throw a validation error', async () => {
            const invalidData = [{
                invalidProperty: 'Test'
            }, {
                name: 'Test',
                email: 'aaa@test.com',
                password: 'abc123',
                invalidProperty: 'Test'
            }, {
                name: 'Test',
                email: 'notAnEmail',
                password: 'abc123'
            }, {}];
            for (const body of invalidData) {
                await Api.testError({
                    method: 'POST',
                    route: '/users',
                    body
                }, 400);
            }
        });
        it('Should throw a forbidden error', async () => {
            await Api.login({
                email: usersData[0].email,
                password: 'test'
            });
            await Api.testError({
                method: 'POST',
                route: '/users',
                body: {
                    name: 'NotCreatedByAnAdmin',
                    email: 'notanadmin@test.com',
                    password: 'abc456'
                }
            }, 403);
        });
        it('Should throw a conflict error', async () => {
            const createResponse = await Api.request({
                method: 'POST',
                route: '/users',
                body: {
                    name: 'Copycat',
                    email: 'copycat@test.com',
                    password: 'abc123'
                }
            });
            expect(createResponse).to.have.status(200);
            await Api.testError({
                method: 'POST',
                route: '/users',
                body: {
                    name: 'AnotherCopycat',
                    email: 'copycat@test.com',
                    password: 'abc456'
                }
            }, 409);
        });
        it('Should create a user', async () => {
            await Api.testCreate({
                route: '/users',
                data: {
                    name: 'Test',
                    email: 'bbb@test.com',
                    password: 'abc123'
                },
                assert: assertUser
            });
        });
    });

    describe('GET /users/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'GET',
                route: '/users/:id'
            });
        });
        it('Should get a user', async () => {
            await Api.testGetOne({
                route: '/users/:id',
                data: usersData[0],
                assert: assertUser
            });
        });
    });

    describe('POST /users/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'POST',
                route: '/users/:id',
                body: {
                    name: 'Test'
                }
            });
        });
        it('Should throw a validation error', async () => {
            const invalidData = [{
                invalidProperty: 'Test'
            }, {
                name: 'Test',
                email: 'tedddst@test.com',
                invalidProperty: 'Test'
            }, {
                email: 'notAnEmail'
            }, {}];
            for (const body of invalidData) {
                await Api.testError({
                    method: 'POST',
                    route: `/users/${Api.userId}`,
                    body
                }, 400);
            }
        });
        it('Should throw a forbidden error', async () => {
            const response = await Api.request({
                method: 'POST',
                route: '/users',
                body: {
                    name: 'Test',
                    email: 'yyy@test.com',
                    password: 'test'
                }
            });
            expect(response).to.have.status(200);
            const { body: { id } } = response;
            await Api.login({
                email: 'yyy@test.com',
                password: 'test'
            });
            await Api.testError({
                method: 'POST',
                route: `/users/${id}`,
                body: {
                    name: 'Test1',
                    email: 'zzz@test.com',
                    password: 'def456',
                    isAdmin: true
                }
            }, 403);
            await Api.testError({
                method: 'POST',
                route: `/users/${usersData[0].id}`,
                body: {
                    name: 'Test1'
                }
            }, 403);
        });
        it('Should edit a user', async () => {
            const response = await Api.request({
                method: 'POST',
                route: '/users',
                body: {
                    name: 'Test',
                    email: 'eee@test.com',
                    password: 'abc123'
                }
            });
            expect(response).to.have.status(200);
            const { body: { id } } = response;
            await Api.login({
                email: 'eee@test.com',
                password: 'abc123'
            });
            await Api.testEdit({
                route: `/users/${id}`,
                data: {
                    name: 'Test1',
                    email: 'fff@test.com',
                    password: 'def456'
                },
                assert: assertUser
            });
            await Api.login();
            await Api.testEdit({
                route: `/users/${id}`,
                data: {
                    name: 'Test1',
                    email: 'fff@test.com',
                    password: 'def456',
                    isAdmin: true
                },
                assert: assertUser
            });
        });
    });
});
