/* eslint-disable max-classes-per-file */
import { FastifyReply, FastifyRequest } from 'fastify';

import {
    type FastifySchemaValidationError,
    type SchemaErrorFormatter
} from 'fastify/types/schema.js';

import { log } from './log.js';

import { ErrorJsonResponse } from '../types/errors.js';

/**
Custom error class with additional http status and data
unless realy necessary do not throw error using this class.
*/
export class CustomError extends Error {
    status: number;
    data: any;
    constructor(message: string, status: number, data?: any) {
        super(message);
        this.status = status;
        if (data) {
            this.data = data;
        }
    }
}

/**
Can be used as type for any custom app error object
*/
export type AppError =
    | InternError
    | NotFoundError
    | ValidationError
    | AuthenticationError
    | ForbiddenError
    | ConflictError;

/**
Can be used as type for any custom app error class
*/
export type AppErrorConstructor =
    | typeof InternError
    | typeof NotFoundError
    | typeof ValidationError
    | typeof AuthenticationError
    | typeof ForbiddenError
    | typeof ConflictError;

/**
Specific custom error classes that should be used to throw errors.
*/
export class InternError extends CustomError {
    constructor(message: string = 'Intern error', data?: any) {
        super(message, 500, data);
    }
}
export class NotFoundError extends CustomError {
    constructor(message: string = 'Not found', data?: any) {
        super(message, 404, data);
    }
}
export class ValidationError extends CustomError {
    constructor(message: string = 'Invalid data', data?: any) {
        super(message, 400, data);
    }
}
export class AuthenticationError extends CustomError {
    constructor(message: string = 'Authentication failed', data?: any) {
        super(message, 401, data);
    }
}
export class ForbiddenError extends CustomError {
    constructor(message: string = 'Not allowed', data?: any) {
        super(message, 403, data);
    }
}
export class ConflictError extends CustomError {
    constructor(message: string = 'Conflict error', data?: any) {
        super(message, 409, data);
    }
}

/**
Fastify schema error formatter
*/
export const schemaErrorFormatter: SchemaErrorFormatter = (
    errors: FastifySchemaValidationError[]
) => new ValidationError('Invalid data', errors);

/**
Fastify error middleware
Send JSON data with the correct HTTP status code and
additional data if specified in the error object
*/
export const errorHandler = (
    err: Error,
    _req: FastifyRequest,
    rep: FastifyReply
): void => {
    if (err instanceof CustomError) {
        // handles custom errors
        const response: ErrorJsonResponse = {
            error: err.message
        };
        if (err.data) {
            response.data = err.data;
        }
        rep.status(err.status).send(response);
    } else {
        // if error is not handled throw an intern error and logs stack
        log.error(err.stack);
        rep.status(500).send({
            error: 'Intern error'
        });
    }
};

/* eslint-enable max-classes-per-file */
