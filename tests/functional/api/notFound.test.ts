import { expect } from 'chai';

import Api, { HttpMethod } from '../../helpers/api.helper';
import { assertError } from '../../helpers/assert.helper';

describe('[API] Global', () => {
    describe('Invalid route should throw not found error', async () => {
        const methods: HttpMethod[] = [
            'GET',
            'POST',
            'PUT',
            'DELETE'
        ];
        const invalidRoutes = [
            '/12345',
            '/azeqsd',
            '/1a2s3f56a4',
            '/321-654-987'
        ];
        await Promise.all(
            methods.map((method) => (
                invalidRoutes.map((route) => (async () => {
                    const response = await Api.request({
                        method,
                        route
                    });
                    expect(response).to.have.status(404);
                    expect(response).to.be.json;
                    assertError(response.body);
                })())
            )).flat()
        );
    });
});
