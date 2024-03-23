import mockDate from 'mockdate';
import dayjs from 'dayjs';
import { describe, expect, test, beforeAll, beforeEach } from 'vitest';

import { mockEnvVar } from '../../../src/services/env.js';

import { assertUser } from '../helpers/assert.helper.js';
import { resetCache, resetData } from '../helpers/data.helper.js';
import { api } from '../helpers/api.helper.js';

const registerUser = async (data: any) => {
    const { invitationCode, ...expected } = data;
    const response = await api.request({
        method: 'POST',
        route: '/register',
        body: data
    });
    expect(response).toHaveStatus(200);
    expect(response.body).to.be.an('object');
    const { body } = response;
    assertUser(body, expected);
};

const generateInvitation = async () => {
    const response = await api.request({
        method: 'POST',
        route: '/invitation'
    });
    expect(response).toHaveStatus(200);
    expect(response.body).to.be.an('object');
    const {
        body: { code }
    } = response;
    expect(code).to.be.a('string');
    expect(code).to.have.lengthOf(16);
    return code;
};

describe('[API] Registration', () => {
    beforeAll(async () => {
        await resetData();
    });
    beforeEach(async () => {
        await resetCache();
    });

    describe('POST /register', () => {
        test('Should throw a forbidden error because registration is disabled', async () => {
            await api.login();
            await api.logout();
            mockEnvVar('REGISTRATION_ENABLED', false);
            await api.testError(
                {
                    method: 'POST',
                    route: '/register',
                    body: {
                        name: 'Test',
                        email: 'ttt@test.com',
                        password: 'abc123'
                    }
                },
                403
            );
        });
        test('Should throw a forbidden error because invitation code is invalid', async () => {
            await api.login();
            await api.logout();
            mockEnvVar('REGISTRATION_ENABLED', true);
            mockEnvVar('INVITATION_ENABLED', true);
            const registerData = [
                {
                    name: 'Test',
                    email: 'ttt@test.com',
                    password: 'abc123'
                },
                {
                    name: 'Test',
                    email: 'ttt@test.com',
                    password: 'abc123',
                    invitationCode: 'invalidCode'
                }
            ];
            for (const data of registerData) {
                await api.testError(
                    {
                        method: 'POST',
                        route: '/register',
                        body: data
                    },
                    403
                );
            }
        });
        test('Should throw a forbidden error because invitation code is already used', async () => {
            await api.login();
            const code = await generateInvitation();
            await api.logout();
            mockEnvVar('REGISTRATION_ENABLED', true);
            mockEnvVar('INVITATION_ENABLED', true);
            await registerUser({
                name: 'Test',
                email: 'ttt@test.com',
                password: 'abc123',
                invitationCode: code
            });
            await api.testError(
                {
                    method: 'POST',
                    route: '/register',
                    body: {
                        name: 'Test',
                        email: 'sss@test.com',
                        password: 'abc123',
                        invitationCode: code
                    }
                },
                403
            );
        });
        test('Should throw a forbidden error because invitation code is expired', async () => {
            await api.login();
            mockDate.set(dayjs().subtract(25, 'hours').toDate());
            const code = await generateInvitation();
            mockDate.reset();
            await api.logout();
            mockEnvVar('REGISTRATION_ENABLED', true);
            mockEnvVar('INVITATION_ENABLED', true);
            await api.testError(
                {
                    method: 'POST',
                    route: '/register',
                    body: {
                        name: 'Test',
                        email: 'uuu@test.com',
                        password: 'abc123',
                        invitationCode: code
                    }
                },
                403
            );
        });
        test('Should register a user', async () => {
            await api.login();
            await api.logout();
            mockEnvVar('REGISTRATION_ENABLED', true);
            mockEnvVar('INVITATION_ENABLED', false);
            await registerUser({
                name: 'Test',
                email: 'yyy@test.com',
                password: 'abc123'
            });
        });
        test('Should register a user with an invitation code', async () => {
            mockEnvVar('REGISTRATION_ENABLED', true);
            mockEnvVar('INVITATION_ENABLED', true);
            await api.login();
            const code = await generateInvitation();
            await api.logout();
            await registerUser({
                name: 'Test',
                email: 'www@test.com',
                password: 'abc123',
                invitationCode: code
            });
        });
    });

    describe('POST /invitation', () => {
        test('Should throw a forbidden error', async () => {
            await api.login();
            mockEnvVar('REGISTRATION_ENABLED', false);
            mockEnvVar('INVITATION_ENABLED', true);
            await api.testError(
                {
                    method: 'POST',
                    route: '/invitation'
                },
                403
            );
            mockEnvVar('REGISTRATION_ENABLED', true);
            mockEnvVar('INVITATION_ENABLED', false);
            await api.testError(
                {
                    method: 'POST',
                    route: '/invitation'
                },
                403
            );
        });
        test('Should generate an invitation code', async () => {
            await api.login();
            mockEnvVar('REGISTRATION_ENABLED', true);
            mockEnvVar('INVITATION_ENABLED', true);
            await generateInvitation();
        });
    });
});
