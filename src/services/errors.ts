/* eslint-disable max-classes-per-file */
import {
    PrismaClientValidationError,
    PrismaClientKnownRequestError
} from '@prisma/client/runtime';
import { Request, Response, NextFunction } from 'express';
import Log from './log';

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
export class ConflictError extends CustomError {
    constructor(message: string = 'Conflict error', data?: any) {
        super(message, 409, data);
    }
}

declare global {
    namespace Express {
        export interface Response {
            error: (err: Error) => void
        }
    }
}

// express middlware injecting a response.error function that handles custom errors
// it returns the correct status code and additional data if specified
export const errorMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    res.error = (err: Error): void => {
        const { message, stack } = err;
        let statusCode = 500;
        const response: Record<string, any> = {
            error: 'Intern error'
        };
        if (err instanceof CustomError) {
            statusCode = err.status;
            response.error = message;
            if (err.data) {
                response.data = err.data;
            }
        } else if (err instanceof PrismaClientValidationError) {
            statusCode = 400;
            response.error = message;
        } else if (err instanceof PrismaClientKnownRequestError) {
            const { code } = err;
            response.error = message;
            switch (code) {
                case 'P2023':
                    statusCode = 400;
                    break;
                default:
                    statusCode = 500;
                    break;
            }
        } else {
            Log.error(stack);
        }
        res.status(statusCode).json(response);
    };
    return next();
};

/* eslint-enable max-classes-per-file */
