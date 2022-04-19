/*
This file must not import any other services and have the bare minimum imports
since it is used in a lot of files in the code base
*/
import {
    Configuration,
    ConfigurationSchema,
    ConfigurationValueType,
    configurationSchema
} from '../../types/configuration';

export const parseConfigurationValue = <ConfigurationDataType>(
    key: keyof ConfigurationDataType,
    value: string,
    type: ConfigurationValueType
): any => {
    const numberRegex = /^\d+$/;
    switch (type) {
        case 'string':
            return String(value);
        case 'number':
            if (!numberRegex.test(value)) {
                throw new Error(`${key} should be a number`);
            }
            return Number(value);
        case 'boolean':
            if (value === '1') { return true; }
            if (value === '0') { return false; }
            throw new Error(`${key} should be either 0 (for false) or 1 (for true)`);
        default:
            throw new Error(`Unexpected configuration type ${type}`);
    }
};

export const parseConfiguration = <ConfigurationDataType>(
    data: Record<string, string>,
    schema: ConfigurationSchema<ConfigurationDataType>
): ConfigurationDataType => {
    const conf: Partial<Record<keyof ConfigurationDataType, any>> = {};
    const errors: string[] = [];
    const keys = Object.keys(schema) as (keyof ConfigurationDataType)[];
    keys.forEach((key) => {
        try {
            const {
                type,
                required,
                filter
            } = schema[key];
            if (data[String(key)]) {
                const value = parseConfigurationValue<ConfigurationDataType>(
                    key,
                    data[String(key)],
                    type
                );
                if (filter && !filter.includes(value)) {
                    throw new Error(`invalid ${key} value (expected ${filter.join(' or ')})`);
                }
                conf[key] = value;
            } else if (required) {
                throw new Error(`missing or empty ${key} in configuration`);
            }
        } catch (err: any) {
            errors.push(err.message);
        }
    });
    if (errors.length) {
        throw new Error(`Invalid configuration: ${errors.join(' ; ')}`);
    }
    return conf as ConfigurationDataType;
};

export const configuration = parseConfiguration<Configuration>(
    process.env as Record<string, string>,
    configurationSchema
);

// utility to mock configuration env vars
const mockedConf: Partial<Configuration> = {};
export const setConfMock = (key: keyof Configuration, value: any) => {
    if (configuration.ENVIRONMENT === 'dev') {
        mockedConf[key] = value;
    }
};

// utility functions to allow mocking registration configuration
export const isRegistrationEnabled = (): boolean => {
    if (configuration.ENVIRONMENT === 'dev' && Object.hasOwn(mockedConf, 'REGISTRATION_ENABLED')) {
        return !!mockedConf.REGISTRATION_ENABLED;
    }
    return configuration.REGISTRATION_ENABLED;
};
export const isInvitationEnabled = (): boolean => {
    if (configuration.ENVIRONMENT === 'dev' && Object.hasOwn(mockedConf, 'INVITATION_ENABLED')) {
        return !!mockedConf.INVITATION_ENABLED;
    }
    return configuration.INVITATION_ENABLED;
};
