import { beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { mockEnvVar } from '../../../src/services/env.js';
import { api } from '../helpers/api.helper.js';
import { compareDataWithExpected } from '../helpers/assert.helper.js';
import { resetCache, resetData } from '../helpers/data.helper.js';

const checkConfiguration = async (expected: any) => {
    const response = await api.request({
        method: 'GET',
        route: '/configuration'
    });
    expect(response).toHaveStatus(200);
    expect(response.body).to.be.an('object');
    const { body } = response;
    compareDataWithExpected(body, expected);
};

describe('[API] Configuration', () => {
    beforeAll(async () => {
        await resetData();
    });
    beforeEach(async () => {
        await resetCache();
    });

    describe('GET /configuration', () => {
        test('Should get public configuration', async () => {
            await api.login();
            await api.logout();
            for (const value of [true, false]) {
                mockEnvVar('REGISTRATION_ENABLED', value);
                mockEnvVar('INVITATION_ENABLED', value);
                await checkConfiguration({
                    registrationEnabled: value,
                    invitationEnabled: value,
                    defaultTheme: 'dark',
                    defaultLocale: 'en',
                    apiVersion: process.env.npm_package_version
                });
            }
        });
    });
});
