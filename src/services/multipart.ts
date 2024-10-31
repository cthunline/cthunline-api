import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import stream from 'node:stream';
import type { Static, TSchema } from '@fastify/type-provider-typebox';
import type { FastifyInstance, FastifyRequest } from 'fastify';

import { emptyObjectSchema } from '../controllers/schemas/definitions.js';
import { InternError, ValidationError } from './errors.js';
import { generateToken } from './tools.js';
import { validateSchema } from './typebox.js';

export type MultipartFileData = {
    mimeType: string;
    fileName: string;
    filePath: string;
};

export type ParsedMultipartValue = MultipartFileData | unknown;

export type ParsedMultipartResult<
    FilesSchema extends TSchema | false | undefined = undefined,
    FieldsSchema extends TSchema | false | undefined = undefined
> = {
    files: FilesSchema extends TSchema
        ? Static<FilesSchema>
        : FilesSchema extends false
          ? Record<string, never>
          : Record<string, MultipartFileData[]>;
    fields: FieldsSchema extends TSchema
        ? Static<FieldsSchema>
        : FieldsSchema extends false
          ? Record<string, never>
          : Record<string, unknown>;
};

export type ParseMultipartFileOptions = {
    tmpDir?: string;
    maxSizePerFile?: number;
    maxSizeTotal?: number;
    maxFiles?: number;
};

export type ParseMultipartOptions<
    FilesSchema extends TSchema | false | undefined = undefined,
    FieldsSchema extends TSchema | false | undefined = undefined
> = {
    app: FastifyInstance;
    req: FastifyRequest;
    schema?: {
        /** If false then there must be no parsed files otherwise a validation will be thrown */
        files?: FilesSchema | false;
        /** If false then there must be no parsed fields otherwise a validation will be thrown */
        fields?: FieldsSchema | false;
    };
} & ParseMultipartFileOptions;

let multipartFiles: MultipartFileData[] = [];

/**
Parses multipart/form-data body.
Result will be two objects :
- A "files" object containing uploaded files by field names
(files are always parsed as arrays even if ther's only one file)
- A "fields" object containing standard non-file fields
*/
export const parseMultipart = async <
    FilesSchema extends TSchema | false | undefined = undefined,
    FieldsSchema extends TSchema | false | undefined = undefined
>({
    app,
    req,
    schema: { fields: fieldsSchema, files: filesSchema } = {},
    tmpDir = os.tmpdir(),
    maxSizePerFile,
    maxSizeTotal,
    maxFiles
}: ParseMultipartOptions<FilesSchema, FieldsSchema>): Promise<
    ParsedMultipartResult<FilesSchema, FieldsSchema>
> => {
    try {
        const result: ParsedMultipartResult = {
            files: {},
            fields: {}
        };
        const parts = req.parts({
            limits: {
                fileSize: maxSizePerFile,
                files: maxFiles
            }
        });
        let totalFileSize = 0;
        for await (const part of parts) {
            const { type, fieldname } = part;
            if (type === 'file') {
                const tmpFilePath = path.join(tmpDir, generateToken(16));
                await stream.promises.pipeline(
                    part.file,
                    fs.createWriteStream(tmpFilePath)
                );
                totalFileSize += part.file.bytesRead;
                if (maxSizeTotal && totalFileSize > maxSizeTotal) {
                    throw new app.multipartErrors.RequestFileTooLargeError();
                }
                const fileData: MultipartFileData = {
                    mimeType: part.mimetype,
                    fileName: part.filename,
                    filePath: tmpFilePath
                };
                multipartFiles.push(fileData);
                if (result.files[fieldname]) {
                    result.files[fieldname].push(fileData);
                } else {
                    result.files[fieldname] = [fileData];
                }
            } else {
                result.fields[fieldname] = part.value;
            }
        }
        if (filesSchema) {
            validateSchema(filesSchema, result.files);
        } else if (filesSchema === false) {
            validateSchema(emptyObjectSchema, result.files);
        }
        if (fieldsSchema) {
            validateSchema(fieldsSchema, result.fields);
        } else if (fieldsSchema === false) {
            validateSchema(emptyObjectSchema, result.fields);
        }
        return result as ParsedMultipartResult<FilesSchema, FieldsSchema>;
    } catch (err: unknown) {
        if (err instanceof app.multipartErrors.RequestFileTooLargeError) {
            throw new ValidationError('Upload file limit size reached');
        }
        throw new ValidationError('Error while parsing uploaded files');
    }
};

export const cleanMultipartFiles = async () => {
    try {
        await Promise.all(
            multipartFiles.map(({ filePath }) =>
                (async () => {
                    try {
                        await fs.promises.unlink(filePath);
                    } catch (err: unknown) {
                        if (err instanceof Error) {
                            const error: NodeJS.ErrnoException = err;
                            /*
                            if file is not there anymore / is missing
                            (already deleted / renamed / moved)
                            just skip and don't throw error
                            */
                            if (
                                typeof error.errno === 'number' &&
                                Math.abs(error.errno) ===
                                    os.constants.errno.ENOENT
                            ) {
                                return;
                            }
                        }
                        throw err;
                    }
                })()
            )
        );
    } catch (err: unknown) {
        const errorBaseMessage = 'Error while cleaning multipart files';
        const errorAdditionalInfo =
            err instanceof Error ? ` : ${err.message}` : '';
        throw new InternError(`${errorBaseMessage}${errorAdditionalInfo}`);
    }
    multipartFiles = [];
};
