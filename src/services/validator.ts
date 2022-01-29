import { Request, Response, NextFunction } from 'express';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { ValidationError } from './errors';

const ajv = new Ajv({
    allErrors: true
});

addFormats(ajv);

export default (schema: Record<string, any>) => {
    const validate = ajv.compile(schema);
    return (data: Record<string, any>) => {
        const valid = validate(data);
        if (valid) {
            return true;
        }
        throw new ValidationError(
            'Invalid data',
            validate.errors
        );
    };
};

export const paramsMiddleware = (
    { params }: Request,
    res: Response,
    next: NextFunction
) => {
    for (const key of Object.keys(params)) {
        if (/[a-zA-Z]+/.test(key)) {
            const value = params[key];
            const error = `Invalid ${key} URL parameter ${value}`;
            try {
                if (!/^\d+$/.test(value)) {
                    throw new ValidationError(error);
                }
            } catch (err: any) {
                res.error(err);
                return;
            }
        }
    }
    next();
};
