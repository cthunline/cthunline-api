import { expect } from 'chai';

import Api, { httpMethods } from '../helpers/api.helper';
import { assertError } from '../helpers/assert.helper';

describe('[API] Global', () => {
    beforeEach(async () => {
        await Api.login();
    });
    it('Should throw not found error because routes are invalid', async () => {
        const invalidRoutes = [
            '/12345',
            '/azeqsd',
            '/1a2s3f56a4',
            '/321-654-987'
        ];
        for (const method of httpMethods) {
            for (const route of invalidRoutes) {
                const response = await Api.request({
                    method,
                    route
                });
                expect(response).to.have.status(404);
                expect(response.body).to.be.an('object');
                assertError(response.body);
            }
        }
    });
});
