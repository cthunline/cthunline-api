import { expect } from 'chai';

import { compareDataWithExpected } from '../helpers/assert.helper.js';
import { mockEnvVar } from '../../../src/services/env.js';
import { resetData } from '../helpers/data.helper.js';
import { api } from '../helpers/api.helper.js';

const getConfiguration = async (expected: any) => {
    const response = await api.request({
        method: 'GET',
        route: '/configuration'
    });
    expect(response).to.have.status(200);
    expect(response.body).to.be.an('object');
    const { body } = response;
    compareDataWithExpected(body, expected);
};

describe('[API] Configuration', () => {
    before(async () => {
        await resetData();
    });

    describe('GET /configuration', () => {
        it('Should get public configuration', async () => {
            await api.login();
            await api.logout();
            for (const value of [true, false]) {
                mockEnvVar('REGISTRATION_ENABLED', value);
                mockEnvVar('INVITATION_ENABLED', value);
                await getConfiguration({
                    registrationEnabled: value,
                    invitationEnabled: value,
                    defaultTheme: 'dark',
                    defaultLocale: 'en'
                });
            }
        });
    });
});
