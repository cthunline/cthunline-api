/*
This file must not import any other services and have the bare minimum imports
since it is used in a lot of files in the code base
*/
import { EnvData, EnvSchema, EnvValueType } from '../types/env';

import envSchema from './env.schema.json';

export const parseEnvVar = <EnvDataType>(
    key: keyof EnvDataType,
    value: string,
    type: EnvValueType
): any => {
    const numberRegex = /^\d+$/;
    switch (type) {
        case 'string':
            return String(value);
        case 'number':
            if (!numberRegex.test(value)) {
                throw new Error(`${String(key)} should be a number`);
            }
            return Number(value);
        case 'boolean':
            if (value === '1' || value === 'true') {
                return true;
            }
            if (value === '0' || value === 'false') {
                return false;
            }
            throw new Error(
                `${String(key)} should be either 0 (for false) or 1 (for true)`
            );
        default:
            throw new Error(`Unexpected environment variable type ${type}`);
    }
};

export const parseEnv = <EnvDataType>(
    data: Record<string, string>,
    schema: EnvSchema<EnvDataType>
): EnvDataType => {
    const env: Partial<Record<keyof EnvDataType, any>> = {};
    const errors: string[] = [];
    const keys = Object.keys(schema) as (keyof EnvDataType)[];
    keys.forEach((key) => {
        try {
            const { type, required, filter } = schema[key];
            if (data[String(key)]) {
                const value = parseEnvVar<EnvDataType>(
                    key,
                    data[String(key)],
                    type
                );
                if (filter && !filter.includes(value)) {
                    throw new Error(
                        `${String(
                            key
                        )} has invalid value (expected ${filter.join(' or ')})`
                    );
                }
                env[key] = value;
            } else if (required) {
                throw new Error(`${String(key)} is missing or empty`);
            }
        } catch (err: any) {
            errors.push(err.message);
        }
    });
    if (errors.length) {
        throw new Error(`Invalid environment variables: ${errors.join(' ; ')}`);
    }
    return env as EnvDataType;
};

export const env = parseEnv<EnvData>(
    process.env as Record<string, string>,
    envSchema as EnvSchema<EnvData>
);

// utility to mock env vars
const mockedEnv: Partial<EnvData> = {};
export const setEnvMock = (key: keyof EnvData, value: any) => {
    if (env.ENVIRONMENT === 'dev') {
        mockedEnv[key] = value;
    }
};

// utility functions to allow mocking registration env vars
export const isRegistrationEnabled = (): boolean => {
    if (
        env.ENVIRONMENT === 'dev' &&
        Object.hasOwn(mockedEnv, 'REGISTRATION_ENABLED')
    ) {
        return !!mockedEnv.REGISTRATION_ENABLED;
    }
    return env.REGISTRATION_ENABLED;
};
export const isInvitationEnabled = (): boolean => {
    if (
        env.ENVIRONMENT === 'dev' &&
        Object.hasOwn(mockedEnv, 'INVITATION_ENABLED')
    ) {
        return !!mockedEnv.INVITATION_ENABLED;
    }
    return env.INVITATION_ENABLED;
};
