/* eslint-disable max-classes-per-file */
import { FastifyReply, FastifyRequest } from 'fastify';
import type {
    FastifySchemaValidationError,
    SchemaErrorFormatter
} from 'fastify/types/schema';
import {
    PrismaClientValidationError,
    PrismaClientKnownRequestError
} from '@prisma/client/runtime/library';

import Log from './log';

import { ErrorJsonResponse } from '../types/errors';

// custom error class with additional http status and data
// unless realy necessary do not throw error using this class
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
Can be used as type for any custom app error class
*/
export interface AppErrorConstructor {
    new (message?: string, data?: any): CustomError;
}

// specific custom error classes that should be used to throw errors
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

// if the given error is a prisma error and is handled then
// returns the matching custom error
const handlePrismaError = (err: Error): Error => {
    if (err instanceof PrismaClientValidationError) {
        return new ValidationError();
    }
    if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === 'P2023') {
            return new ValidationError();
        }
        if (err.code === 'P2025') {
            return new NotFoundError();
        }
    }
    return err;
};

// TODO
// handles payload too large errors thrown by bordy parser middleware
// export const payloadTooLargeHandler = (
//     err: Error,
//     _req: Request,
//     res: Response,
//     next: NextFunction
// ) => {
//     if (err.constructor.name === 'PayloadTooLargeError') {
//         res.status(413).json({
//             error: 'Payload is too large'
//         });
//     } else {
//         next();
//     }
// };

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
    // handles prisma errors by "converting" them into custom errors
    const error = handlePrismaError(err);
    if (error instanceof CustomError) {
        // handles custom errors
        const response: ErrorJsonResponse = {
            error: error.message
        };
        if (error.data) {
            response.data = error.data;
        }
        rep.status(error.status).send(response);
    } else {
        // if error is not handled throw an intern error and logs stack
        Log.error(error.stack);
        rep.status(500).send({
            error: 'Intern error'
        });
    }
};

/* eslint-enable max-classes-per-file */
