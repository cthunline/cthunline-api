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
