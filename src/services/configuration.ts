/*
This file must not import any other services and have the bare minimum imports
since it is used in a lot of files in the code base
*/
import {
    Configuration,
    ConfigurationKey,
    ConfigurationSchema,
    ConfigurationValueType,
    configurationSchema,
    defaultConfiguration
} from '../types/configuration';

export const parseConfigurationValue = (
    key: ConfigurationKey,
    value: string,
    type: ConfigurationValueType
): any => {
    switch (type) {
        case 'string':
            return String(value);
        case 'number':
            if (Number.isNaN(value)) {
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

export const controlConfiguration = (
    data: Record<string, string>,
    schema: ConfigurationSchema,
    throwError: boolean
): Configuration => {
    const conf: Configuration = { ...defaultConfiguration };
    const errors: string[] = [];
    const keys = Object.keys(schema) as ConfigurationKey[];
    keys.forEach((key) => {
        try {
            const type = schema[key];
            if (data[key]) {
                (conf as Record<ConfigurationKey, any>)[key] = (
                    parseConfigurationValue(key, data[key], type)
                );
            } else {
                throw new Error(`missing or empty ${key} in configuration`);
            }
        } catch (err: any) {
            errors.push(err.message);
        }
    });
    if (throwError && errors.length) {
        throw new Error(`Invalid configuration: ${errors.join(' ; ')}`);
    }
    return conf;
};

export const configuration = controlConfiguration(
    process.env as Record<string, string>,
    configurationSchema,
    true
);
