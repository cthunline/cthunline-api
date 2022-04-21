import { expect } from 'chai';

import { parseConfiguration } from '../../src/services/configuration';
import { ConfigurationSchema } from '../../src/types/configuration';

interface ConfType {
    STRING: string;
    NUMBER: number;
    BOOLEAN: boolean;
    OPTIONAL: string;
    ENUM: string;
}

const schema: ConfigurationSchema<ConfType> = {
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

const validConf: Record<string, string> = {
    STRING: 'test',
    NUMBER: '123',
    BOOLEAN: '1',
    OPTIONAL: 'test',
    ENUM: 'value1'
};

describe('[Unit] Configuration', () => {
    describe('parseConfiguration', () => {
        it('Should control and parse configuration', async () => {
            const { OPTIONAL, ...validPartialConf } = validConf;
            const { STRING, ...invalidPartialConf } = validConf;
            const data = [{
                conf: validConf,
                shouldSucceed: true
            }, {
                conf: validPartialConf,
                shouldSucceed: true
            }, {
                conf: invalidPartialConf,
                shouldSucceed: false
            }, {
                conf: {
                    ...validConf,
                    STRING: ''
                },
                shouldSucceed: false
            }, {
                conf: {
                    ...validConf,
                    NUMBER: 'invalid'
                },
                shouldSucceed: false
            }, {
                conf: {
                    ...validConf,
                    BOOLEAN: 'invalid'
                },
                shouldSucceed: false
            }, {
                conf: {
                    ...validConf,
                    ENUM: 'value3'
                },
                shouldSucceed: false
            }];
            data.forEach(({ conf, shouldSucceed }) => {
                if (shouldSucceed) {
                    expect(() => (
                        parseConfiguration(conf, schema)
                    )).to.not.throw();
                } else {
                    expect(() => (
                        parseConfiguration(conf, schema)
                    )).to.throw(Error);
                }
            });
        });
    });
});
