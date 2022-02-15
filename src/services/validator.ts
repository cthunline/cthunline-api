import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { ValidationError } from './errors';

const ajv = new Ajv({
    allErrors: true
});

addFormats(ajv);

// return a function that validates data against a json schema
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
