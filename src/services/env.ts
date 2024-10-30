/*
This file must not import any other services and have the bare minimum imports
since it is used in a lot of files in the code base
*/
import { envious } from '@pitininja/envious';

import { envSchema } from './env.schema.js';

const env = envious(envSchema);

type Env = typeof env;

const initialEnv: Env = { ...env };

/**
Return an environment variable value
*/
export const getEnv = <T extends keyof Env>(key: T) => env[key];

/**
Dynamicaly change an environment variable value for testing purpose
*/
export const mockEnvVar = <T extends keyof Env>(key: T, value: Env[T]) => {
    if (env.NODE_ENV === 'development') {
        env[key] = value;
    }
};

/**
Reset an environment variable value to its initial value.
Can be used if environment variable values are changed for testing purposes.
*/
export const resetEnvVar = <T extends keyof Env>(key: T) => {
    if (env.NODE_ENV === 'development') {
        env[key] = initialEnv[key];
    }
};
