import { usersData, resetData } from '../helpers/data.helper.js';
import { api } from '../helpers/api.helper.js';

describe('[API] Authentication', () => {
    before(async () => {
        await resetData();
    });

    describe('GET /auth', () => {
        it('Should throw authentication error', async () => {
            await api.checkAuth(false);
        });
        it('Should check authentication successfully', async () => {
            await api.login();
            await api.checkAuth();
        });
    });

    describe('POST /auth', () => {
        it('Should throw validation error', async () => {
            const invalidData = [
                {
                    invalidProperty: 'Test'
                },
                {
                    email: 'admin@test.com',
                    password: 'abc123',
                    invalidProperty: 'Test'
                },
                {}
            ];
            for (const body of invalidData) {
                await api.testError(
                    {
                        method: 'POST',
                        route: '/auth',
                        body
                    },
                    400
                );
            }
        });
        it('Should throw authentication error', async () => {
            const invalidCredentials = [
                {
                    email: 'admin@test.com',
                    password: '654987azeaze'
                },
                {
                    email: 'fake@fake.com',
                    password: 'azeaze321321'
                }
            ];
            for (const credentials of invalidCredentials) {
                await api.login(credentials, false);
            }
            const disabledUser = usersData.find(({ isEnabled }) => !isEnabled);
            await api.login(
                {
                    email: disabledUser?.email ?? '',
                    password: 'test'
                },
                false
            );
        });
        it('Should check authentication successfully', async () => {
            await api.login();
            await api.checkAuth();
        });
    });

    describe('DELETE /auth', () => {
        it('Should throw authentication error', async () => {
            await api.login();
            await api.logout();
            await api.logout(false);
        });
        it('Should check authentication successfully', async () => {
            await api.login();
            await api.logout();
            await api.checkAuth(false);
        });
    });
});
