import Chai, { expect } from 'chai';
import ChaiHttp from 'chai-http';

import server from '../../src';
import {
    assertError,
    assertToken
} from './assert.helper';

Chai.use(ChaiHttp);

before((done) => {
    server.on('ready', () => {
        done();
    });
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
    createdById?: number | null;
    assert: (
        data: Record<string, any>,
        expected?: Record<string, any>
    ) => void;
}

export interface EditOptions {
    route: string;
    data: Record<string, any>;
    updatedBy?: number | null;
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

export interface PutOptions {
    route: string;
    body?: Record<string, any>;
    data: Record<string, any>;
    assert: (
        data: Record<string, any>,
        expected?: Record<string, any>
    ) => void;
}

export interface InvalidIdOptions {
    method: HttpMethod;
    route: string;
    body?: Record<string, any>;
    ids?: string[];
}

export interface ValidationOptions {
    route: string;
    data: Record<string, any>[];
}

export interface CredentialOptions {
    email: string;
    password: string;
}

const Api = {
    userId: '',
    bearer: '',
    credentials: {
        email: 'test@test.com',
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
            assertToken(body);
            Api.bearer = body.bearer;
            Api.userId = body.userId;
            return body;
        }
        expect(response).to.have.status(401);
        expect(response).to.be.json;
        assertError(body);
        return null;
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
            Api.bearer = '';
            Api.userId = '';
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
            assertToken(response.body);
        } else {
            expect(response).to.have.status(401);
            expect(response).to.be.json;
            assertError(response.body);
        }
    },

    async request(options: RequestOptions): Promise<ChaiHttp.Response> {
        const {
            method,
            route,
            body,
            fields,
            files,
            auth
        } = options;
        const lowerMethod = method.toLowerCase() as HttpLowerMethod;
        const request = Chai.request(server)[lowerMethod](route);
        if (auth !== false && Api.bearer) {
            request.set('Authorization', `Bearer ${Api.bearer}`);
        }
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
            createdById
        } = options;
        const createResponse = await Api.request({
            method: 'POST',
            route,
            body: data
        });
        expect(createResponse).to.have.status(200);
        expect(createResponse).to.be.json;
        const { body: createBody } = createResponse;
        const expected = { ...data };
        if (createdById) {
            expected.createdById = createdById;
        }
        assert(createBody, expected);
        const getResponse = await Api.request({
            method: 'GET',
            route: `${route}/${createBody.id}`
        });
        expect(getResponse).to.have.status(200);
        expect(getResponse).to.be.json;
        const { body: getBody } = getResponse;
        assert(getBody, expected);
    },

    async testEdit(options: EditOptions): Promise<void> {
        const {
            route,
            data,
            assert,
            updatedBy
        } = options;
        const editResponse = await Api.request({
            method: 'POST',
            route,
            body: data
        });
        expect(editResponse).to.have.status(200);
        expect(editResponse).to.be.json;
        const { body: editBody } = editResponse;
        const expected = { ...data };
        if (updatedBy) {
            expected.updatedBy = updatedBy;
        }
        assert(editBody, expected);
        const getResponse = await Api.request({
            method: 'GET',
            route
        });
        expect(getResponse).to.have.status(200);
        expect(getResponse).to.be.json;
        const { body: getBody } = getResponse;
        assert(getBody, expected);
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

    async testPut(options: PutOptions): Promise<void> {
        const {
            route,
            data,
            assert,
            body
        } = options;
        const response = await Api.request({
            method: 'PUT',
            route,
            body
        });
        expect(response).to.have.status(200);
        expect(response).to.be.json;
        const { body: putBody } = response;
        expect(putBody).to.be.an('object');
        assert(putBody, data);
    },

    async testInvalidIdError(options: InvalidIdOptions): Promise<void> {
        const {
            method,
            route,
            body,
            ids
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
        for (const id of invalidIds) {
            const isInvalid = !/^[0-9a-f]{24}$/.test(id);
            const response = await Api.request({
                method,
                route: route.split(':id').join(id),
                body
            });
            expect(response).to.have.status(isInvalid ? 400 : 404);
            expect(response).to.be.json;
            assertError(response.body);
        }
    },

    async testValidationError(options: ValidationOptions): Promise<void> {
        const {
            route,
            data
        } = options;
        for (const body of data) {
            const response = await Api.request({
                method: 'POST',
                route,
                body
            });
            expect(response).to.have.status(400);
            expect(response).to.be.json;
            assertError(response.body);
        }
    },

    async testStaticFile(route: string): Promise<void> {
        const response = await Api.request({
            method: 'GET',
            route
        });
        expect(response).to.have.status(200);
    }
};

export default Api;
