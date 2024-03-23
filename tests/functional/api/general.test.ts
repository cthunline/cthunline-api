import { describe, expect, test, beforeEach, beforeAll } from 'vitest';

import { api, httpMethods } from '../helpers/api.helper.js';
import { assertError } from '../helpers/assert.helper.js';
import { resetCache, resetData } from '../helpers/data.helper.js';

describe('[API] General', () => {
    beforeAll(async () => {
        await resetData();
    });
    beforeEach(async () => {
        await resetCache();
        await api.login();
    });
    test('Should throw not found error because routes are invalid', async () => {
        const invalidRoutes = [
            '/12345',
            '/azeqsd',
            '/1a2s3f56a4',
            '/321-654-987'
        ];
        for (const method of httpMethods) {
            for (const route of invalidRoutes) {
                const response = await api.request({
                    method,
                    route
                });
                expect(response).toHaveStatus(404);
                expect(response.body).to.be.an('object');
                assertError(response.body);
            }
        }
    });
});
