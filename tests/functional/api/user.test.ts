import { expect } from 'chai';

import { usersData, resetData } from '../helpers/data.helper.js';
import { assertUser } from '../helpers/assert.helper.js';
import { api } from '../helpers/api.helper.js';

describe('[API] Users', () => {
    before(async () => {
        await resetData();
    });
    beforeEach(async () => {
        await api.login();
    });
    afterEach(async () => {
        await api.logout();
    });

    describe('GET /users', () => {
        it('Should list users', async () => {
            await api.testGetList({
                route: '/users',
                listKey: 'users',
                data: usersData.filter(({ isEnabled }) => isEnabled),
                assert: assertUser
            });
        });
        it('Should list all users including disabled ones', async () => {
            await api.testGetList({
                route: '/users?disabled=true',
                listKey: 'users',
                data: usersData,
                assert: assertUser
            });
        });
    });

    describe('POST /users', () => {
        it('Should throw a validation error', async () => {
            const invalidData = [
                {
                    invalidProperty: 'Test'
                },
                {
                    name: 'Test',
                    email: 'aaa@test.com',
                    password: 'abc123',
                    invalidProperty: 'Test'
                },
                {
                    name: 'Test',
                    email: 'notAnEmail',
                    password: 'abc123'
                },
                {
                    name: 'Test',
                    email: 'test@test.com',
                    password: 'abc123',
                    theme: 'invalidTheme'
                },
                {
                    name: 'Test',
                    email: 'test@test.com',
                    password: 'abc123',
                    locale: 'invalidLocale'
                },
                {}
            ];
            for (const body of invalidData) {
                await api.testError(
                    {
                        method: 'POST',
                        route: '/users',
                        body
                    },
                    400
                );
            }
        });
        it('Should throw a forbidden error', async () => {
            await api.login({
                email: usersData[0].email,
                password: 'test'
            });
            await api.testError(
                {
                    method: 'POST',
                    route: '/users',
                    body: {
                        name: 'NotCreatedByAnAdmin',
                        email: 'notanadmin@test.com',
                        password: 'abc456'
                    }
                },
                403
            );
        });
        it('Should throw a conflict error', async () => {
            const createResponse = await api.request({
                method: 'POST',
                route: '/users',
                body: {
                    name: 'Copycat',
                    email: 'copycat@test.com',
                    password: 'abc123'
                }
            });
            expect(createResponse).to.have.status(200);
            await api.testError(
                {
                    method: 'POST',
                    route: '/users',
                    body: {
                        name: 'AnotherCopycat',
                        email: 'copycat@test.com',
                        password: 'abc456'
                    }
                },
                409
            );
        });
        it('Should create a user', async () => {
            const createData = [
                {
                    name: 'Test1',
                    email: 'uuu@test.com',
                    password: 'abc123'
                },
                {
                    name: 'Test2',
                    email: 'iii@test.com',
                    password: 'abc123',
                    theme: 'dark'
                },
                {
                    name: 'Test3',
                    email: 'ooo@test.com',
                    password: 'abc123',
                    locale: 'en'
                },
                {
                    name: 'Test4',
                    email: 'ppp@test.com',
                    password: 'abc123',
                    theme: 'light',
                    locale: 'fr'
                }
            ];
            for (const data of createData) {
                await api.testCreate({
                    route: '/users',
                    data,
                    assert: assertUser
                });
            }
        });
    });

    describe('GET /users/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'GET',
                route: '/users/:id'
            });
        });
        it('Should get a user', async () => {
            await api.testGetOne({
                route: '/users/:id',
                data: usersData[0],
                assert: assertUser
            });
        });
    });

    describe('POST /users/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'POST',
                route: '/users/:id',
                body: {
                    name: 'Test'
                }
            });
        });
        it('Should throw a validation error', async () => {
            const invalidData = [
                {
                    invalidProperty: 'Test'
                },
                {
                    name: 'Test',
                    email: 'tedddst@test.com',
                    invalidProperty: 'Test'
                },
                {
                    email: 'notAnEmail'
                },
                {
                    password: 'missingOldPassword'
                },
                {
                    password: 'newPassword',
                    oldPassword: 'wrongOldPassword'
                },
                {
                    theme: 'invalidTheme'
                },
                {
                    locale: 'invalidLocale'
                },
                {}
            ];
            for (const body of invalidData) {
                await api.testError(
                    {
                        method: 'POST',
                        route: `/users/${api.userId}`,
                        body
                    },
                    400
                );
            }
        });
        it('Should throw a forbidden error', async () => {
            const email = 'yyy@test.com';
            const password = 'testtest';
            const response = await api.request({
                method: 'POST',
                route: '/users',
                body: {
                    name: 'Test',
                    email,
                    password
                }
            });
            expect(response).to.have.status(200);
            const {
                body: { id }
            } = response;
            await api.login({
                email,
                password
            });
            const bodies = [
                {
                    isAdmin: true
                },
                {
                    isEnabled: true
                }
            ];
            for (const body of bodies) {
                await api.testError(
                    {
                        method: 'POST',
                        route: `/users/${id}`,
                        body
                    },
                    403
                );
            }
            await api.testError(
                {
                    method: 'POST',
                    route: `/users/${usersData[0].id}`,
                    body: {
                        name: 'Test1'
                    }
                },
                403
            );
        });
        it('Should edit a user', async () => {
            const newEmail = 'fff@test.com';
            const newPassword1 = 'abc123';
            const newPassword2 = 'def456';
            const newPassword3 = 'oiu345';
            const response = await api.request({
                method: 'POST',
                route: '/users',
                body: {
                    name: 'Test',
                    email: 'eee@test.com',
                    password: newPassword1
                }
            });
            expect(response).to.have.status(200);
            const {
                body: { id }
            } = response;
            await api.login({
                email: 'eee@test.com',
                password: newPassword1
            });
            await api.testEdit({
                route: `/users/${id}`,
                data: {
                    name: 'Test1',
                    email: newEmail,
                    password: newPassword2,
                    oldPassword: newPassword1,
                    theme: 'dark',
                    locale: 'en'
                },
                assert: assertUser
            });
            await api.login();
            const editData = [
                {
                    name: 'Test1',
                    email: newEmail,
                    password: newPassword3,
                    oldPassword: newPassword2,
                    isAdmin: true
                },
                {
                    theme: 'light',
                    locale: 'fr'
                }
            ];
            for (const data of editData) {
                await api.testEdit({
                    route: `/users/${id}`,
                    data,
                    assert: assertUser
                });
            }
        });
    });
});
