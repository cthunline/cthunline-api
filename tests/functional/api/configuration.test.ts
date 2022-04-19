import { expect } from 'chai';

import Api from '../helpers/api.helper';
import Data from '../helpers/data.helper';
import { compareDataWithExpected } from '../helpers/assert.helper';
import { setConfMock } from '../../../src/services/controllerServices/configuration';

const getConfiguration = async (expected: any) => {
    const response = await Api.request({
        method: 'GET',
        route: '/configuration'
    });
    expect(response).to.have.status(200);
    expect(response).to.be.json;
    const { body } = response;
    compareDataWithExpected(body, expected);
};

describe('[API] Configuration', () => {
    before(async () => {
        await Data.reset();
    });

    describe('GET /configuration', () => {
        it('Should get public configuration', async () => {
            await Api.login();
            await Api.logout();
            for (const value of [true, false]) {
                setConfMock('REGISTRATION_ENABLED', value);
                setConfMock('INVITATION_ENABLED', value);
                await getConfiguration({
                    registrationEnabled: value,
                    invitationEnabled: value
                });
            }
        });
    });
});
