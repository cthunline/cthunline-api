import fs from 'node:fs';
import path from 'node:path';
import type { FastifyBaseLogger } from 'fastify';
import pino, { type Level, type StreamEntry } from 'pino';
import pretty from 'pino-pretty';

import { getEnv } from './env.js';

const environment = getEnv('ENVIRONMENT');
const level = getEnv('LOG_LEVEL');

/**
Log stream in console (pretty format)
*/
const streams: StreamEntry[] = [{ stream: pretty() }];

// array containing messages to display after logger initialization
const output: { message: string; level: Level }[] = [];

// controls log directory exists and is writable (if provided)
let logDirIsValid = false;
const logDir = getEnv('LOG_DIR');
if (logDir) {
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

/**
Log stream in file (JSON format)
*/
if (logDir && logDirIsValid) {
    const logFilePath = path.join(logDir, 'cthunline.log');
    streams.push({
        stream: fs.createWriteStream(logFilePath)
    });
}

/**
Logger instance that can be used in code to log stuff.
*/
export const log = pino(
    {
        level
    },
    pino.multistream(streams)
);

/**
Logger instance for fastify only.
It has a specific level depending on the environment.
- In production : level is set to 'warning'
- In development : level is set to the configured log level in the environment variables
*/
export const fastifyLogger: FastifyBaseLogger = pino(
    {
        level: environment === 'prod' ? 'warn' : level
    },
    pino.multistream(streams)
);

// logs initialization output if there is any
if (output.length) {
    for (const { level, message } of output) {
        log[level](`Logger initialization ${level} : ${message}`);
    }
}
