import Api from '../../helpers/api.helper';
import Data from '../../helpers/data.helper';

describe('[API] Authentication', () => {
    beforeEach(async () => {
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
                email: 'test@test.com',
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
                email: 'test@test.com',
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
        });
        it('Should check authentication successfully', async () => {
            await Api.login();
            await Api.checkAuth();
        });
    });

    describe('DELETE /auth', () => {
        it('Should throw authentication error', async () => {
            await Api.logout(false);
        });
        it('Should check authentication successfully', async () => {
            await Api.login();
            await Api.logout();
            await Api.checkAuth(false);
        });
    });
});
