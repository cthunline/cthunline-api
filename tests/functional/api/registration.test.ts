import { expect } from 'chai';
import MockDate from 'mockdate';
import DayJs from 'dayjs';

import Api from '../helpers/api.helper';
import Data from '../helpers/data.helper';
import { assertUser } from '../helpers/assert.helper';
import { setEnvMock } from '../../../src/services/env';

const registerUser = async (data: any) => {
    const { invitationCode, ...expected } = data;
    const response = await Api.request({
        method: 'POST',
        route: '/register',
        body: data
    });
    expect(response).to.have.status(200);
    expect(response).to.be.json;
    const { body } = response;
    assertUser(body, expected);
};

const generateInvitation = async () => {
    const response = await Api.request({
        method: 'POST',
        route: '/invitation'
    });
    expect(response).to.have.status(200);
    expect(response).to.be.json;
    const { body: { code } } = response;
    expect(code).to.be.a('string');
    expect(code).to.have.lengthOf(16);
    return code;
};

describe('[API] Registration', () => {
    before(async () => {
        await Data.reset();
    });

    describe('POST /register', () => {
        it('Should throw a forbidden error because registration is disabled', async () => {
            await Api.login();
            await Api.logout();
            setEnvMock('REGISTRATION_ENABLED', false);
            await Api.testError({
                method: 'POST',
                route: '/register',
                body: {
                    name: 'Test',
                    email: 'ttt@test.com',
                    password: 'abc123'
                }
            }, 403);
        });
        it('Should throw a forbidden error because invitation code is invalid', async () => {
            await Api.login();
            await Api.logout();
            setEnvMock('REGISTRATION_ENABLED', true);
            setEnvMock('INVITATION_ENABLED', true);
            const registerData = [{
                name: 'Test',
                email: 'ttt@test.com',
                password: 'abc123'
            }, {
                name: 'Test',
                email: 'ttt@test.com',
                password: 'abc123',
                invitationCode: 'invalidCode'
            }];
            await Promise.all(
                registerData.map((data) => (
                    Api.testError({
                        method: 'POST',
                        route: '/register',
                        body: data
                    }, 403)
                ))
            );
        });
        it('Should throw a forbidden error because invitation code is already used', async () => {
            await Api.login();
            const code = await generateInvitation();
            await Api.logout();
            setEnvMock('REGISTRATION_ENABLED', true);
            setEnvMock('INVITATION_ENABLED', true);
            await registerUser({
                name: 'Test',
                email: 'ttt@test.com',
                password: 'abc123',
                invitationCode: code
            });
            await Api.testError({
                method: 'POST',
                route: '/register',
                body: {
                    name: 'Test',
                    email: 'sss@test.com',
                    password: 'abc123',
                    invitationCode: code
                }
            }, 403);
        });
        it('Should throw a forbidden error because invitation code is expired', async () => {
            await Api.login();
            MockDate.set(DayJs().subtract(25, 'hours').toDate());
            const code = await generateInvitation();
            MockDate.reset();
            await Api.logout();
            setEnvMock('REGISTRATION_ENABLED', true);
            setEnvMock('INVITATION_ENABLED', true);
            await Api.testError({
                method: 'POST',
                route: '/register',
                body: {
                    name: 'Test',
                    email: 'uuu@test.com',
                    password: 'abc123',
                    invitationCode: code
                }
            }, 403);
        });
        it('Should register a user', async () => {
            await Api.login();
            await Api.logout();
            setEnvMock('REGISTRATION_ENABLED', true);
            setEnvMock('INVITATION_ENABLED', false);
            await registerUser({
                name: 'Test',
                email: 'yyy@test.com',
                password: 'abc123'
            });
        });
        it('Should register a user with an invitation code', async () => {
            setEnvMock('REGISTRATION_ENABLED', true);
            setEnvMock('INVITATION_ENABLED', true);
            await Api.login();
            const code = await generateInvitation();
            await Api.logout();
            await registerUser({
                name: 'Test',
                email: 'www@test.com',
                password: 'abc123',
                invitationCode: code
            });
        });
    });

    describe('POST /invitation', () => {
        it('Should throw a forbidden error', async () => {
            await Api.login();
            setEnvMock('REGISTRATION_ENABLED', false);
            setEnvMock('INVITATION_ENABLED', true);
            await Api.testError({
                method: 'POST',
                route: '/invitation'
            }, 403);
            setEnvMock('REGISTRATION_ENABLED', true);
            setEnvMock('INVITATION_ENABLED', false);
            await Api.testError({
                method: 'POST',
                route: '/invitation'
            }, 403);
        });
        it('Should generate an invitation code', async () => {
            await Api.login();
            setEnvMock('REGISTRATION_ENABLED', true);
            setEnvMock('INVITATION_ENABLED', true);
            await generateInvitation();
        });
    });
});
