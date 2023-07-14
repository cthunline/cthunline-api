/*
This file must not import any other services and have the bare minimum imports
since it is used in a lot of files in the code base
*/
import { Value } from '@sinclair/typebox/value';
import { Static } from '@sinclair/typebox';
import Os from 'os';

import { envSchema } from './env.schema';

type Env = Static<typeof envSchema>;

const parsed = Value.Convert(envSchema, process.env);

const errors = [...Value.Errors(envSchema, parsed)];
if (errors.length) {
    const computedErrorMessages: Record<string, string[]> = {};
    errors.forEach(({ path, message }) => {
        const envVarName = path.replace(/^\//, '');
        if (!computedErrorMessages[envVarName]) {
            computedErrorMessages[envVarName] = [];
        }
        computedErrorMessages[envVarName].push(message);
    });
    const errorTextParts: string[] = [
        'Invalid environment variables',
        ...Object.entries(computedErrorMessages).map(
            ([varName, messages]) => `  ${varName} : ${messages.join(', ')}`
        )
    ];
    throw new Error(errorTextParts.join(Os.EOL));
}

const env: Env = Value.Cast(
    {
        ...envSchema,
        additionalProperties: false
    },
    parsed
);

const initialEnv: Env = { ...env };

/**
Return an environment variable value
*/
export const getEnv = <T extends keyof Env>(key: T) => env[key];

/**
Dynamicaly change an environment variable value for testing purpose
*/
export const mockEnvVar = <T extends keyof Env>(key: T, value: Env[T]) => {
    if (env.ENVIRONMENT === 'dev') {
        env[key] = value;
    }
};

/**
Reset an environment variable value to its initial value.
Can be used if environment variable values are changed for testing purposes.
*/
export const resetEnvVar = <T extends keyof Env>(key: T) => {
    if (env.ENVIRONMENT === 'dev') {
        env[key] = initialEnv[key];
    }
};
