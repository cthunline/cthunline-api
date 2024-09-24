import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import stream from 'node:stream';
import { type Static, type TSchema, Type } from '@sinclair/typebox';
import type { FastifyInstance, FastifyRequest } from 'fastify';

import { InternError, ValidationError } from './errors.js';
import { generateToken } from './tools.js';
import { validateSchema } from './typebox.js';

export type MultipartFileData = {
    mimeType: string;
    fileName: string;
    filePath: string;
};

export type ParsedMultipartValue = MultipartFileData | unknown;

export type ParsedMultipartBody<T extends TSchema | undefined = undefined> =
    T extends TSchema
        ? Static<T>
        : Record<string, ParsedMultipartValue | ParsedMultipartValue[]>;

export type ParseMultipartBodyFileOptions = {
    tmpDir?: string;
    maxSizePerFile?: number;
    maxSizeTotal?: number;
    maxFiles?: number;
};

export type ParseMultipartBodyOptions<
    T extends TSchema | undefined = undefined
> = {
    app: FastifyInstance;
    req: FastifyRequest;
    schema?: T;
} & ParseMultipartBodyFileOptions;

let multipartFiles: MultipartFileData[] = [];

export const parseMultipartBody = async <
    T extends TSchema | undefined = undefined
>({
    app,
    req,
    schema,
    tmpDir = os.tmpdir(),
    maxSizePerFile,
    maxSizeTotal,
    maxFiles
}: ParseMultipartBodyOptions<T>): Promise<ParsedMultipartBody<T>> => {
    try {
        const body: ParsedMultipartBody = {};
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
                const fileData: MultipartFileData = {
                    mimeType: part.mimetype,
                    fileName: part.filename,
                    filePath: tmpFilePath
                };
                multipartFiles.push(fileData);
                if (Array.isArray(body[fieldname])) {
                    body[fieldname].push(fileData);
                } else {
                    body[fieldname] = [fileData];
                }
            } else if (Object.hasOwn(body, fieldname)) {
                if (Array.isArray(body[fieldname])) {
                    body[fieldname].push(part.value);
                } else {
                    body[fieldname] = [body[fieldname], part.value];
                }
            } else {
                body[fieldname] = part.value;
            }
        }
        if (maxSizeTotal && totalFileSize > maxSizeTotal) {
            throw new app.multipartErrors.RequestFileTooLargeError();
        }
        if (schema) {
            validateSchema(schema, body);
        }
        return body as ParsedMultipartBody<T>;
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
            multipartFiles.map(({ filePath }) => fs.promises.unlink(filePath))
        );
    } catch {
        throw new InternError('Error while cleaning multipart files');
    }
    multipartFiles = [];
};

export const multipartFileSchema = Type.Object(
    {
        mimeType: Type.String(),
        fileName: Type.String(),
        filePath: Type.String()
    } satisfies Record<keyof MultipartFileData, TSchema>,
    {
        additionalProperties: false
    }
);
