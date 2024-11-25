import fs from 'node:fs';
import path from 'node:path';
import type { FastifyBaseLogger } from 'fastify';
import pino, { type Level, type StreamEntry } from 'pino';
import pretty from 'pino-pretty';

import { getEnv } from './env.js';

const logLevel = getEnv('LOG_LEVEL');
const fastifyLogLevel = getEnv('FASTIFY_LOG_LEVEL');

type RequestLog = {
    req: {
        method: string;
        url: string;
        hostname: string;
        remoteAddress: string;
    };
};

const isRequestLog = (log: Record<string, unknown>): log is RequestLog =>
    typeof log.req === 'object' &&
    log.req !== null &&
    Object.hasOwn(log.req, 'method') &&
    Object.hasOwn(log.req, 'url');

// array containing messages to display after logger initialization
const output: { message: string; level: Level }[] = [];

let logDirIsValid = false;
const logDir = getEnv('LOG_DIR');
if (logDir) {
    // controls log if directory exists and is writable
    try {
        fs.accessSync(logDir, fs.constants.F_OK);
        fs.accessSync(logDir, fs.constants.W_OK);
        logDirIsValid = true;
    } catch {
        output.push({
            level: 'error',
            message: `file stream directory ${logDir} does not exist or is not writable`
        });
    }
} else {
    output.push({
        level: 'warn',
        message: 'no directory provided for file stream'
    });
}

const getStreams = (level: Level) => {
    const streams: StreamEntry[] = [
        {
            level,
            // log stream in console (pretty format)
            stream: pretty({
                translateTime: 'yyyy-mm-dd HH:mm:ss.lp',
                hideObject: true,
                messageFormat: (log, messageKey) => {
                    let reqMessage = '';
                    if (isRequestLog(log)) {
                        reqMessage = ` - ${log.req.method} ${log.req.url}`;
                    }
                    return `${log[messageKey] ?? ''}${reqMessage}`;
                }
            })
        }
    ];
    if (logDir && logDirIsValid) {
        // log stream in file (JSON format)
        const logFilePath = path.join(logDir, 'cthunline.log');
        streams.push({
            level,
            stream: fs.createWriteStream(logFilePath)
        });
    }
    return streams;
};

/**
Logger instance that can be used in code to log stuff.
*/
export const log = pino(
    {
        level: logLevel
    },
    pino.multistream(getStreams(logLevel))
);

/**
Logger instance for fastify only.
It has a specific level depending on the environment.
- In production : level is set to 'warning'
- In development : level is set to the configured log level in the environment variables
*/
export const fastifyLogger: FastifyBaseLogger = pino(
    {
        level: fastifyLogLevel ?? logLevel
    },
    pino.multistream(getStreams(fastifyLogLevel ?? logLevel))
);

// logs initialization output if there is any
if (output.length) {
    for (const { level, message } of output) {
        log[level](`Logger initialization ${level} : ${message}`);
    }
}
