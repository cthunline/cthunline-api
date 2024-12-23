import type { FastifyReply, FastifyRequest } from 'fastify';

import type {
    FastifySchemaValidationError,
    SchemaErrorFormatter
} from 'fastify/types/schema.js';

import { log } from './log.js';

/**
Custom error class with additional http status and data
unless realy necessary do not throw error using this class.
*/
export class CustomError extends Error {
    status: number;
    data: unknown;
    constructor(message: string, status: number, data?: unknown) {
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
    constructor(message = 'Intern error', data?: unknown) {
        super(message, 500, data);
    }
}
export class NotFoundError extends CustomError {
    constructor(message = 'Not found', data?: unknown) {
        super(message, 404, data);
    }
}
export class ValidationError extends CustomError {
    constructor(message = 'Invalid data', data?: unknown) {
        super(message, 400, data);
    }
}
export class AuthenticationError extends CustomError {
    constructor(message = 'Authentication failed', data?: unknown) {
        super(message, 401, data);
    }
}
export class ForbiddenError extends CustomError {
    constructor(message = 'Not allowed', data?: unknown) {
        super(message, 403, data);
    }
}
export class ConflictError extends CustomError {
    constructor(message = 'Conflict error', data?: unknown) {
        super(message, 409, data);
    }
}

/**
Fastify schema error formatter
*/
export const schemaErrorFormatter: SchemaErrorFormatter = (
    errors: FastifySchemaValidationError[]
) => new ValidationError('Invalid data', errors);

interface ErrorJsonResponse {
    error: string;
    data?: unknown;
}

/**
Fastify error middleware
Send JSON data with the correct HTTP status code and
additional data if specified in the error object
*/
export const errorHandler = (
    err: Error,
    _req: FastifyRequest,
    rep: FastifyReply
) => {
    if (err instanceof CustomError) {
        // handles custom errors
        const response: ErrorJsonResponse = {
            error: err.message
        };
        if (err.data) {
            response.data = err.data;
        }
        if (err instanceof InternError) {
            log.error(err.stack);
        }
        return rep.status(err.status).send(response);
    }
    // if error is not handled throw an intern error and logs stack
    log.error(err.stack);
    return rep.status(500).send({
        error: 'Intern error'
    });
};
