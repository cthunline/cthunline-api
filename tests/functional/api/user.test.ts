import { expect } from 'chai';
import Api from '../../helpers/api.helper';
import Data from '../../helpers/data.helper';
import { assertUser, assertError } from '../../helpers/assert.helper';
import usersData from '../../data/users.json';

describe('[API] Users', () => {
    beforeEach(async () => {
        await Data.reset();
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
            await Api.testValidationError({
                route: '/users',
                data: [{
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
                }, {}]
            });
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
            const duplicateResponse = await Api.request({
                method: 'POST',
                route: '/users',
                body: {
                    name: 'AnotherCopycat',
                    email: 'copycat@test.com',
                    password: 'abc456'
                }
            });
            expect(duplicateResponse).to.have.status(409);
            expect(duplicateResponse).to.be.json;
            assertError(duplicateResponse.body);
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
            const response = await Api.request({
                method: 'POST',
                route: '/users',
                body: {
                    name: 'Test',
                    email: 'ccc@test.com',
                    password: 'abc123'
                }
            });
            expect(response).to.have.status(200);
            const { body: { id } } = response;
            await Api.testValidationError({
                route: `/users/${id}`,
                data: [{
                    invalidProperty: 'Test'
                }, {
                    name: 'Test',
                    email: 'tedddst@test.com',
                    invalidProperty: 'Test'
                }, {
                    email: 'notAnEmail'
                }, {}]
            });
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
            await Api.testEdit({
                route: `/users/${id}`,
                data: {
                    name: 'Test1',
                    email: 'fff@test.com',
                    password: 'def456'
                },
                assert: assertUser
            });
        });
    });
});
