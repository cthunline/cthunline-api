import Ajv, { type Options as AjvOptions } from 'ajv';
import ajvFormats from 'ajv-formats';
import type { FastifyInstance } from 'fastify';

const ajvBaseOptions: AjvOptions = {
    removeAdditional: false,
    coerceTypes: false,
    allErrors: true
};

const defaultCompiler = new Ajv(ajvBaseOptions);
ajvFormats(defaultCompiler);

const coerceCompiler = new Ajv({
    ...ajvBaseOptions,
    coerceTypes: true
});
ajvFormats(coerceCompiler);

const schemaCompilers: Record<string, Ajv> = {
    body: defaultCompiler,
    params: coerceCompiler,
    querystring: coerceCompiler
};

const errorPrefix = 'Error while settings validator compiler';

export const setValidatorCompilers = (app: FastifyInstance) => {
    app.setValidatorCompiler(({ httpPart, schema }) => {
        if (!httpPart) {
            throw new Error(`${errorPrefix} : missing httpPart`);
        }
        const compiler = schemaCompilers[httpPart] ?? defaultCompiler;
        return compiler.compile(schema);
    });
};
