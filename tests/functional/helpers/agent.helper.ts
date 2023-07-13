import {
    FastifyInstance,
    InjectOptions,
    LightMyRequestResponse
} from 'fastify';

export interface AgentResponse extends LightMyRequestResponse {
    body: any;
}

export interface RequestOptions extends InjectOptions {
    parseJson?: boolean;
}

export default class Agent {
    app: FastifyInstance;
    cookies: { [k: string]: string };

    constructor(app: FastifyInstance) {
        this.app = app;
        this.cookies = {};
    }

    async request({
        parseJson = true,
        ...options
    }: RequestOptions): Promise<AgentResponse> {
        const response = await this.app.inject({
            ...options,
            cookies: this.cookies
        });
        response.cookies.forEach(({ name, value }) => {
            this.cookies[name] = value;
        });
        if (parseJson) {
            return {
                ...response,
                body: response.json()
            };
        }
        return response;
    }
}
