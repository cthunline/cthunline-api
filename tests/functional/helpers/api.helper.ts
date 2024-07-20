import type { OutgoingHttpHeaders } from 'node:http';
import path from 'node:path';
import { fastifyCookie } from '@fastify/cookie';
import FormData from 'form-data';
import { afterAll, beforeAll, expect } from 'vitest';

import { app, initApp } from '../../../src/app.js';
import { getEnv } from '../../../src/services/env.js';

import { Agent } from './agent.helper.js';
import { assertError, assertUser } from './assert.helper.js';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export const httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE'];

beforeAll(async () => {
    await initApp();
    await app.listen({ port: getEnv('PORT'), host: '0.0.0.0' });
    await app.ready();
});

afterAll(async () => {
    await app.close();
});

export interface RequestFileOption {
    field: string;
    name: string;
    buffer: Buffer;
}

export interface RequestOptions {
    customAgent?: Agent;
    method: HttpMethod;
    route: string;
    body?: Record<string, any>;
    fields?: Record<string, any>;
    files?: RequestFileOption[];
    auth?: boolean;
    apiPrefix?: boolean;
    parseJson?: boolean;
}

export interface GetListOptions {
    route: string;
    listKey: string;
    data: Record<string, any>[];
    assert: (data: Record<string, any>, expected?: Record<string, any>) => void;
}

export interface GetOneOptions {
    route: string;
    data: Record<string, any>;
    assert: (data: Record<string, any>, expected?: Record<string, any>) => void;
}

export interface CreateOptions {
    route: string;
    data: Record<string, any>;
    expected?: Record<string, any>;
    getRoute?: string;
    assert: (data: Record<string, any>, expected?: Record<string, any>) => void;
}

export interface EditOptions {
    route: string;
    data: Record<string, any>;
    expected?: Record<string, any>;
    assert: (data: Record<string, any>, expected?: Record<string, any>) => void;
}

export interface DeleteOptions {
    route: string;
    data?: Record<string, any>;
    assert?: (
        data: Record<string, any>,
        expected?: Record<string, any>
    ) => void;
    testGet?: boolean;
}

export interface InvalidIdOptions {
    method: HttpMethod;
    route: string;
    body?: Record<string, any>;
    ids?: string[];
    isInteger?: boolean;
}

export interface CredentialOptions {
    email: string;
    password: string;
}

export const api = {
    agent: new Agent(app),
    apiPrefix: '/api',
    userId: 0,
    credentials: {
        email: 'admin@test.com',
        password: 'test'
    },

    async request({
        customAgent,
        method,
        route,
        body,
        fields,
        files,
        apiPrefix = true,
        parseJson = true
    }: RequestOptions) {
        let headers: OutgoingHttpHeaders | undefined;
        let formData: FormData | null = null;
        if (!body && (fields || files)) {
            formData = new FormData();
            if (fields) {
                for (const [key, value] of Object.entries(fields)) {
                    formData?.append(key, value);
                }
            }
            if (files) {
                for (const { field, buffer, name } of files) {
                    formData?.append(field, buffer, {
                        filename: name
                    });
                }
            }
            headers = formData.getHeaders();
        }
        return (customAgent ?? this.agent).request({
            method,
            url: apiPrefix ? path.join(this.apiPrefix, route) : route,
            payload: body ?? formData ?? undefined,
            parseJson,
            headers
        });
    },

    newAgent() {
        return new Agent(app);
    },

    async login(
        credentials?: CredentialOptions,
        expectSuccess = true
    ): Promise<any> {
        const response = await api.request({
            method: 'POST',
            route: '/auth',
            body: credentials ?? api.credentials
        });
        const { body } = response;
        if (expectSuccess) {
            expect(response).toHaveStatus(200);
            assertUser(body);
            api.userId = body.id;
            if (api.agent.cookies.jwt) {
                const { value } = fastifyCookie.unsign(
                    api.agent.cookies.jwt,
                    process.env.COOKIE_SECRET ?? ''
                );
                if (value) {
                    return {
                        ...body,
                        jwt: value
                    };
                }
            }
            throw new Error('Could not get token from response cookie');
        }
        expect(response).toHaveStatus(401);
        expect(body).to.be.an('object');
        assertError(body);
        return null;
    },

    async logout(expectSuccess = true): Promise<void> {
        const response = await api.request({
            method: 'DELETE',
            route: '/auth'
        });
        if (expectSuccess) {
            expect(response).toHaveStatus(200);
            expect(response.body).to.be.an('object');
            expect(response.body).to.be.an('object');
            expect(Object.keys(response.body)).toHaveLength(0);
            api.userId = 0;
        } else {
            expect(response).toHaveStatus(401);
            expect(response.body).to.be.an('object');
            assertError(response.body);
        }
    },

    async checkAuth(expectSuccess = true): Promise<void> {
        const response = await api.request({
            method: 'GET',
            route: '/auth'
        });
        if (expectSuccess) {
            expect(response).toHaveStatus(200);
            expect(response.body).to.be.an('object');
            assertUser(response.body);
        } else {
            expect(response).toHaveStatus(401);
            expect(response.body).to.be.an('object');
            assertError(response.body);
        }
    },

    async testError(
        options: RequestOptions,
        expectedStatus: number
    ): Promise<void> {
        const response = await api.request(options);
        expect(response).toHaveStatus(expectedStatus);
        expect(response.body).to.be.an('object');
        assertError(response.body);
    },

    async testGetList(options: GetListOptions): Promise<void> {
        const { route, listKey, data, assert } = options;
        const dataById: Record<number, object> = Object.fromEntries(
            data.map((item: Record<string, any>) => [item.id, item])
        );
        const response = await api.request({
            method: 'GET',
            route
        });
        expect(response).toHaveStatus(200);
        expect(response.body).to.be.an('object');
        const { body } = response;
        expect(body[listKey]).to.be.an('array');
        expect(body[listKey]).to.have.lengthOf(data.length);
        for (const item of body[listKey]) {
            assert(item, dataById[item.id]);
        }
    },

    async testGetOne(options: GetOneOptions): Promise<void> {
        const { route, data, assert } = options;
        const response = await api.request({
            method: 'GET',
            route: route.replace(':id', data.id)
        });
        expect(response).toHaveStatus(200);
        expect(response.body).to.be.an('object');
        const { body } = response;
        assert(body, data);
    },

    async testCreate(options: CreateOptions): Promise<void> {
        const { route, data, assert, expected, getRoute } = options;
        const createResponse = await api.request({
            method: 'POST',
            route,
            body: data
        });
        expect(createResponse).toHaveStatus(200);
        expect(createResponse.body).to.be.an('object');
        const { body: createBody } = createResponse;
        const expectedData = expected ?? data;
        assert(createBody, expectedData);
        const getResponse = await api.request({
            method: 'GET',
            route: getRoute
                ? getRoute.replace(':id', createBody.id)
                : `${route}/${createBody.id}`
        });
        expect(getResponse).toHaveStatus(200);
        expect(getResponse.body).to.be.an('object');
        const { body: getBody } = getResponse;
        assert(getBody, expectedData);
    },

    async testEdit(options: EditOptions): Promise<void> {
        const { route, data, assert, expected } = options;
        const editResponse = await api.request({
            method: 'PATCH',
            route,
            body: data
        });
        expect(editResponse).toHaveStatus(200);
        expect(editResponse.body).to.be.an('object');
        const { body: editBody } = editResponse;
        const expectedData = expected ?? data;
        assert(editBody, expectedData);
        const getResponse = await api.request({
            method: 'GET',
            route
        });
        expect(getResponse).toHaveStatus(200);
        expect(getResponse.body).to.be.an('object');
        const { body: getBody } = getResponse;
        assert(getBody, expectedData);
    },

    async testDelete(options: DeleteOptions): Promise<void> {
        const { route, testGet, data, assert } = options;
        const deleteResponse = await api.request({
            method: 'DELETE',
            route
        });
        expect(deleteResponse).toHaveStatus(200);
        expect(deleteResponse.body).to.be.an('object');
        const { body: deleteBody } = deleteResponse;
        if (assert && data) {
            assert(deleteBody, data);
        } else {
            expect(deleteBody).to.be.an('object');
            expect(Object.keys(deleteBody)).toHaveLength(0);
        }
        if (testGet !== false) {
            const getResponse = await api.request({
                method: 'GET',
                route
            });
            expect(getResponse).toHaveStatus(404);
            expect(getResponse.body).to.be.an('object');
            assertError(getResponse.body);
        }
    },

    async testInvalidIdError(options: InvalidIdOptions): Promise<void> {
        const { method, route, body, ids, isInteger = true } = options;
        const invalidIds = ids ?? [
            '123456789',
            '987654',
            'azeqsd',
            '1a2s3f56a4',
            '321-654-987',
            '61f5655bb7c63e78815de1c6',
            '61f5655bb7c63e78815de1c7',
            '61f5655cb7c63e78815de1c8'
        ];
        for (const id of invalidIds) {
            const isInvalid = !/^\d+$/.test(id);
            const response = await api.request({
                method,
                route: route.split(':id').join(id),
                body
            });
            expect(response).toHaveStatus(isInvalid && isInteger ? 400 : 404);
            expect(response.body).to.be.an('object');
            assertError(response.body);
        }
    },

    async testStaticFile(route: string, expectSuccess = true): Promise<void> {
        const response = await api.request({
            apiPrefix: false,
            method: 'GET',
            route,
            parseJson: false
        });
        if (expectSuccess) {
            expect(response).toHaveStatus(200);
        } else {
            expect(response).toHaveStatus(404);
        }
    }
};
