import { HTTPMethods } from 'fastify';

import { ValidationError } from './errors.js';
import { isInteger } from './tools.js';

/**
Parses IDs from Fastify params object.
If ID is a number returns the integer value otherwise throws a validation error.
*/
export const parseParamId = (
    params: { [key: string]: string },
    idFieldName: string
) => {
    if (params[idFieldName] && isInteger(params[idFieldName])) {
        return parseInt(params[idFieldName]);
    }
    throw new ValidationError(`Parameter ${idFieldName} is not a valid ID`);
};

const fastifyHttpMethods: HTTPMethods[] = [
    'DELETE',
    'GET',
    'HEAD',
    'PATCH',
    'POST',
    'PUT',
    'OPTIONS',
    'SEARCH',
    'TRACE',
    'PROPFIND',
    'PROPPATCH',
    'MKCOL',
    'COPY',
    'MOVE',
    'LOCK',
    'UNLOCK'
];

/**
Get HTTP methods supported by Fastify
*/
export const getFastifyHttpMethods = (options?: {
    exclude: HTTPMethods | HTTPMethods[];
}) => {
    if (options?.exclude && Array.isArray(options.exclude)) {
        return fastifyHttpMethods.filter(
            (method) => !options.exclude.includes(method)
        );
    }
    if (options?.exclude) {
        return fastifyHttpMethods.filter(
            (method) => options.exclude !== method
        );
    }
    return fastifyHttpMethods;
};
