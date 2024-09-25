import fs from 'node:fs';
import path from 'node:path';
import type { FastifyBaseLogger } from 'fastify';
import pino, { type StreamEntry } from 'pino';
import pretty from 'pino-pretty';

import { getEnv } from './env.js';

const level = getEnv('LOG_LEVEL');

/**
Log stream in console (pretty format)
*/
const streams: StreamEntry[] = [{ stream: pretty() }];

/**
Control log file directory exists and is writable
*/
let fileStreamError = null;
const logDir = getEnv('LOG_DIR');
if (logDir) {
    try {
        fs.accessSync(logDir, fs.constants.F_OK);
        fs.accessSync(logDir, fs.constants.W_OK);
    } catch {
        fileStreamError = `log directory ${getEnv(
            'LOG_DIR'
        )} does not exist or is not writable`;
    }
} else {
    fileStreamError = 'no log directory provided';
}

/**
Log stream in file (JSON format)
*/
if (logDir && !fileStreamError) {
    const logFilePath = path.join(logDir, 'cthunline.log');
    streams.push({
        stream: fs.createWriteStream(logFilePath)
    });
}

/**
Logger instance.
*/
export const log: FastifyBaseLogger = pino(
    {
        level,
        customLevels: {
            always: 999
        }
    },
    pino.multistream(streams)
);

if (fileStreamError) {
    log.warn(
        `Logger file stream could not be initialized (${fileStreamError})`
    );
}
