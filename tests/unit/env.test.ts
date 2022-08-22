import { expect } from 'chai';

import { parseEnv } from '../../src/services/env';
import { EnvSchema } from '../../src/types/env';

interface EnvType {
    STRING: string;
    NUMBER: number;
    BOOLEAN: boolean;
    OPTIONAL: string;
    ENUM: string;
}

const schema: EnvSchema<EnvType> = {
    STRING: {
        type: 'string',
        required: true
    },
    NUMBER: {
        type: 'number',
        required: true
    },
    BOOLEAN: {
        type: 'boolean',
        required: true
    },
    OPTIONAL: {
        type: 'string',
        required: false
    },
    ENUM: {
        type: 'string',
        required: false,
        filter: ['value1', 'value2']
    }
};

const validEnv: Record<string, string> = {
    STRING: 'test',
    NUMBER: '123',
    BOOLEAN: 'true',
    OPTIONAL: 'test',
    ENUM: 'value1'
};

describe('[Unit] Environment', () => {
    describe('parseEnvironment', () => {
        it('Should control and parse environment variables', async () => {
            const { OPTIONAL, ...validPartialEnv } = validEnv;
            const { STRING, ...invalidPartialEnv } = validEnv;
            const data = [{
                env: validEnv,
                shouldSucceed: true
            }, {
                env: validPartialEnv,
                shouldSucceed: true
            }, {
                env: invalidPartialEnv,
                shouldSucceed: false
            }, {
                env: {
                    ...validEnv,
                    STRING: ''
                },
                shouldSucceed: false
            }, {
                env: {
                    ...validEnv,
                    NUMBER: 'invalid'
                },
                shouldSucceed: false
            }, {
                env: {
                    ...validEnv,
                    BOOLEAN: 'invalid'
                },
                shouldSucceed: false
            }, {
                env: {
                    ...validEnv,
                    ENUM: 'value3'
                },
                shouldSucceed: false
            }];
            data.forEach(({ env, shouldSucceed }) => {
                if (shouldSucceed) {
                    expect(() => (
                        parseEnv(env, schema)
                    )).to.not.throw();
                } else {
                    expect(() => (
                        parseEnv(env, schema)
                    )).to.throw(Error);
                }
            });
        });
    });
});
