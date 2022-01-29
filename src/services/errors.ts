/* eslint-disable max-classes-per-file */
import {
    PrismaClientValidationError,
    PrismaClientKnownRequestError
} from '@prisma/client/runtime';
import { Request, Response, NextFunction } from 'express';
import Log from './log';

class CustomError extends Error {
    status: number;
    data: any;

    constructor(message: string, status: number, data: any = null) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

export class InternError extends CustomError {
    constructor(message: string = 'Intern error') {
        super(message, 500);
    }
}
export class NotFoundError extends CustomError {
    constructor(message: string = 'Not found') {
        super(message, 404);
    }
}
export class ValidationError extends CustomError {
    constructor(message: string = 'Invalid data', data: any = null) {
        super(message, 400, data);
    }
}
export class AuthenticationError extends CustomError {
    constructor(message: string = 'Authentication failed') {
        super(message, 401);
    }
}
export class ConflictError extends CustomError {
    constructor(message: string = 'Conflict error') {
        super(message, 409);
    }
}

declare global {
    namespace Express {
        export interface Response {
            error: (err: Error) => void
        }
    }
}

export const errorMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    res.error = (err: Error): void => {
        const { message, stack } = err;
        let statusCode = 500;
        const response: Record<string, any> = {
            error: 'Intern error'
        };
        if (err instanceof CustomError) {
            statusCode = err.status;
            if (err.data) {
                response.data = err.data;
            }
        } else if (err instanceof PrismaClientValidationError) {
            statusCode = 400;
            response.message = message;
        } else if (err instanceof PrismaClientKnownRequestError) {
            const { code } = err;
            response.message = message;
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
