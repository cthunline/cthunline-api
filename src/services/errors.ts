/* eslint-disable max-classes-per-file */
import {
    PrismaClientValidationError,
    PrismaClientKnownRequestError
} from '@prisma/client/runtime/library';
import {
    Request,
    Response,
    NextFunction
} from 'express';

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

// express middlware injecting a response.error function that handles custom errors
// it returns the correct status code and additional data if specified
export const errorMiddleware = (_req: Request, res: Response, next: NextFunction): void => {
    res.error = (err: Error): void => {
        // handles prisma errors by "converting" them into custom errors
        const error = handlePrismaError(err);
        if (error instanceof CustomError) { // handles custom errors
            const response: ErrorJsonResponse = {
                error: error.message
            };
            if (error.data) {
                response.data = error.data;
            }
            res.status(error.status).json(response);
        } else { // if error is not handled throw an intern error and logs stack
            Log.error(error.stack);
            res.status(500).json({
                error: 'Intern error'
            });
        }
    };
    return next();
};

// handles payload too large errors thrown by bordy parser middleware
export const payloadTooLargeHandler = (
    err: Error,
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err.constructor.name === 'PayloadTooLargeError') {
        res.status(413).json({
            error: 'Payload is too large'
        });
    } else {
        next();
    }
};

/* eslint-enable max-classes-per-file */
