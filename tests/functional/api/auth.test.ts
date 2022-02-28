import Api from '../helpers/api.helper';
import Data from '../helpers/data.helper';

import usersData from '../data/users.json';

describe('[API] Authentication', () => {
    before(async () => {
        await Data.reset();
    });

    describe('GET /auth', () => {
        it('Should throw authentication error', async () => {
            await Api.checkAuth(false);
        });
        it('Should check authentication successfully', async () => {
            await Api.login();
            await Api.checkAuth();
        });
    });

    describe('POST /auth', () => {
        it('Should throw validation error', async () => {
            const invalidData = [{
                invalidProperty: 'Test'
            }, {
                email: 'admin@test.com',
                password: 'abc123',
                invalidProperty: 'Test'
            }, {}];
            for (const body of invalidData) {
                await Api.testError({
                    method: 'POST',
                    route: '/auth',
                    body
                }, 400);
            }
        });
        it('Should throw authentication error', async () => {
            const invalidCredentials = [{
                email: 'admin@test.com',
                password: '654987azeaze'
            }, {
                email: 'fake@fake.com',
                password: 'azeaze321321'
            }];
            await Promise.all(
                invalidCredentials.map((credentials) => (
                    Api.login(credentials, false)
                ))
            );
            const disabledUser = usersData.find(({ isEnabled }) => !isEnabled);
            await Api.login({
                email: disabledUser?.email ?? '',
                password: 'test'
            }, false);
        });
        it('Should check authentication successfully', async () => {
            await Api.login();
            await Api.checkAuth();
        });
    });

    describe('DELETE /auth', () => {
        it('Should throw authentication error', async () => {
            await Api.login();
            await Api.logout();
            await Api.logout(false);
        });
        it('Should check authentication successfully', async () => {
            await Api.login();
            await Api.logout();
            await Api.checkAuth(false);
        });
    });
});
