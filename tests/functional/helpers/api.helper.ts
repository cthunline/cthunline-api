import Chai, { expect } from 'chai';
import ChaiHttp from 'chai-http';
import Path from 'path';
import CookieParser from 'cookie-parser';

import server from '../../../src';
import { assertError, assertUser } from './assert.helper';

Chai.use(ChaiHttp);

const chaiHttpAgent = Chai.request.agent(server);

before((done) => {
    server.on('ready', () => {
        done();
    });
});

after(() => {
    chaiHttpAgent.close();
});

type HttpUpperMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type HttpLowerMethod = 'get' | 'post' | 'put' | 'delete';
export type HttpMethod = HttpUpperMethod | HttpLowerMethod;

export interface RequestFileOption {
    field: string;
    name: string;
    buffer: Buffer;
}

export interface RequestOptions {
    method: HttpMethod;
    route: string;
    body?: Record<string, any>;
    fields?: Record<string, any>;
    files?: RequestFileOption[];
    auth?: boolean;
    apiPrefix?: boolean;
}

export interface GetListOptions {
    route: string;
    listKey: string;
    data: Record<string, any>[];
    assert: (
        data: Record<string, any>,
        expected?: Record<string, any>
    ) => void;
}

export interface GetOneOptions {
    route: string;
    data: Record<string, any>;
    assert: (
        data: Record<string, any>,
        expected?: Record<string, any>
    ) => void;
}

export interface CreateOptions {
    route: string;
    data: Record<string, any>;
    expected?: Record<string, any>;
    getRoute?: string;
    assert: (
        data: Record<string, any>,
        expected?: Record<string, any>
    ) => void;
}

export interface EditOptions {
    route: string;
    data: Record<string, any>;
    expected?: Record<string, any>;
    assert: (
        data: Record<string, any>,
        expected?: Record<string, any>
    ) => void;
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
    isObjectId?: boolean;
}

export interface CredentialOptions {
    email: string;
    password: string;
}

const Api = {
    userId: 0,
    credentials: {
        email: 'admin@test.com',
        password: 'test'
    },

    async login(
        credentials?: CredentialOptions,
        expectSuccess: boolean = true
    ): Promise<any> {
        const response = await Api.request({
            method: 'POST',
            route: '/auth',
            body: credentials ?? Api.credentials
        });
        const { body } = response;
        if (expectSuccess) {
            expect(response).to.have.status(200);
            assertUser(body);
            Api.userId = body.id;
            return {
                ...body,
                token: this.getCookieToken(response)
            };
        }
        expect(response).to.have.status(401);
        expect(response).to.be.json;
        assertError(body);
        return null;
    },

    getCookieToken(response: ChaiHttp.Response) {
        const tokenRegex = /token=([^;]+);/;
        const responseCookie = response.get('Set-Cookie');
        if (responseCookie[0]) {
            const match = tokenRegex.exec(responseCookie[0]);
            if (match?.[1]) {
                const decodedToken = CookieParser.signedCookie(
                    decodeURIComponent(match[1]),
                    process.env.COOKIE_SECRET ?? ''
                );
                if (decodedToken) {
                    return decodedToken;
                }
            }
        }
        throw new Error('Could not get token from response cookie');
    },

    async logout(expectSuccess: boolean = true): Promise<void> {
        const response = await Api.request({
            method: 'DELETE',
            route: '/auth'
        });
        if (expectSuccess) {
            expect(response).to.have.status(200);
            expect(response).to.be.json;
            expect(response.body).to.be.an('object').and.be.empty;
            Api.userId = 0;
        } else {
            expect(response).to.have.status(401);
            expect(response).to.be.json;
            assertError(response.body);
        }
    },

    async checkAuth(expectSuccess: boolean = true): Promise<void> {
        const response = await Api.request({
            method: 'GET',
            route: '/auth'
        });
        if (expectSuccess) {
            expect(response).to.have.status(200);
            expect(response).to.be.json;
            assertUser(response.body);
        } else {
            expect(response).to.have.status(401);
            expect(response).to.be.json;
            assertError(response.body);
        }
    },

    async request({
        method,
        route,
        body,
        fields,
        files,
        apiPrefix = true
    }: RequestOptions): Promise<ChaiHttp.Response> {
        const lowerMethod = method.toLowerCase() as HttpLowerMethod;
        const request = chaiHttpAgent[lowerMethod](
            apiPrefix ? Path.join('/api', route) : route
        );
        if (body) {
            request.send(body);
        } else {
            if (fields) {
                Object.entries(fields).forEach(([key, value]) => {
                    request.field(key, value);
                });
            }
            if (files) {
                files.forEach(({ field, buffer, name }) => {
                    request.attach(field, buffer, name);
                });
            }
        }
        return request;
    },

    async testError(options: RequestOptions, expectedStatus: number): Promise<void> {
        const response = await Api.request(options);
        expect(response).to.have.status(expectedStatus);
        expect(response).to.be.json;
        assertError(response.body);
    },

    async testGetList(options: GetListOptions): Promise<void> {
        const {
            route,
            listKey,
            data,
            assert
        } = options;
        const dataById: Record<number, object> = Object.fromEntries(
            data.map((item: Record<string, any>) => [item.id, item])
        );
        const response = await Api.request({
            method: 'GET',
            route
        });
        expect(response).to.have.status(200);
        expect(response).to.be.json;
        const { body } = response;
        expect(body[listKey]).to.be.an('array');
        expect(body[listKey]).to.have.lengthOf(data.length);
        body[listKey].forEach((item: Record<string, any>) => {
            assert(item, dataById[item.id]);
        });
    },

    async testGetOne(options: GetOneOptions): Promise<void> {
        const {
            route,
            data,
            assert
        } = options;
        const response = await Api.request({
            method: 'GET',
            route: route.replace(':id', data.id)
        });
        expect(response).to.have.status(200);
        expect(response).to.be.json;
        const { body } = response;
        assert(body, data);
    },

    async testCreate(options: CreateOptions): Promise<void> {
        const {
            route,
            data,
            assert,
            expected,
            getRoute
        } = options;
        const createResponse = await Api.request({
            method: 'POST',
            route,
            body: data
        });
        expect(createResponse).to.have.status(200);
        expect(createResponse).to.be.json;
        const { body: createBody } = createResponse;
        const expectedData = expected ?? data;
        assert(createBody, expectedData);
        const getResponse = await Api.request({
            method: 'GET',
            route: getRoute ? (
                getRoute.replace(':id', createBody.id)
            ) : (
                `${route}/${createBody.id}`
            )
        });
        expect(getResponse).to.have.status(200);
        expect(getResponse).to.be.json;
        const { body: getBody } = getResponse;
        assert(getBody, expectedData);
    },

    async testEdit(options: EditOptions): Promise<void> {
        const {
            route,
            data,
            assert,
            expected
        } = options;
        const editResponse = await Api.request({
            method: 'POST',
            route,
            body: data
        });
        expect(editResponse).to.have.status(200);
        expect(editResponse).to.be.json;
        const { body: editBody } = editResponse;
        const expectedData = expected ?? data;
        assert(editBody, expectedData);
        const getResponse = await Api.request({
            method: 'GET',
            route
        });
        expect(getResponse).to.have.status(200);
        expect(getResponse).to.be.json;
        const { body: getBody } = getResponse;
        assert(getBody, expectedData);
    },

    async testDelete(options: DeleteOptions): Promise<void> {
        const {
            route,
            testGet,
            data,
            assert
        } = options;
        const deleteResponse = await Api.request({
            method: 'DELETE',
            route
        });
        expect(deleteResponse).to.have.status(200);
        expect(deleteResponse).to.be.json;
        const { body: deleteBody } = deleteResponse;
        if (assert && data) {
            assert(deleteBody, data);
        } else {
            expect(deleteBody).to.be.an('object').and.be.empty;
        }
        if (testGet !== false) {
            const getResponse = await Api.request({
                method: 'GET',
                route
            });
            expect(getResponse).to.have.status(404);
            expect(getResponse).to.be.json;
            assertError(getResponse.body);
        }
    },

    async testInvalidIdError(options: InvalidIdOptions): Promise<void> {
        const {
            method,
            route,
            body,
            ids,
            isObjectId = true
        } = options;
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
        await Promise.all(
            invalidIds.map((id) => (
                (async () => {
                    const isInvalid = !/^\d+$/.test(id);
                    const response = await Api.request({
                        method,
                        route: route.split(':id').join(id),
                        body
                    });
                    expect(response).to.have.status(
                        isInvalid && isObjectId ? 400 : 404
                    );
                    expect(response).to.be.json;
                    assertError(response.body);
                })()
            ))
        );
    },

    async testStaticFile(route: string, expectSuccess: boolean = true): Promise<void> {
        const response = await Api.request({
            apiPrefix: false,
            method: 'GET',
            route
        });
        if (expectSuccess) {
            expect(response).to.have.status(200);
        } else {
            expect(response).to.have.status(404);
        }
    }
};

export default Api;
