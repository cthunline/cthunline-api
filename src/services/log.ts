import fs from 'node:fs';
import path from 'node:path';
import type { FastifyBaseLogger } from 'fastify';
import winston, { format } from 'winston';

import { getEnv } from './env.js';

const level = getEnv('LOG_LEVEL');

const printf = (i: winston.Logform.TransformableInfo) =>
    `${i.timestamp} [${i.level}] ${i.message}`;

const timestamp = {
    format: 'YYYY-MM-DD HH:mm:ss'
};

/**
Default log transport in console.
*/
const transports: winston.transport[] = [
    new winston.transports.Console({
        level,
        handleExceptions: false,
        format: format.combine(
            format.colorize(),
            format.timestamp(timestamp),
            format.printf(printf)
        )
    })
];

/**
Control log file directory exists and is writable
*/
let fileTransportError = null;
const logDir = getEnv('LOG_DIR');
if (logDir) {
    try {
        fs.accessSync(logDir, fs.constants.F_OK);
        fs.accessSync(logDir, fs.constants.W_OK);
    } catch {
        fileTransportError = `log directory ${getEnv(
            'LOG_DIR'
        )} does not exist or is not writable`;
    }
} else {
    fileTransportError = 'no log directory provided';
}

if (logDir && !fileTransportError) {
    // log transport in file
    transports.push(
        new winston.transports.File({
            level,
            filename: path.join(logDir, 'cthunline.log'),
            handleExceptions: false,
            maxsize: 5242880,
            maxFiles: 5,
            format: format.combine(
                format.timestamp(timestamp),
                format.printf(printf)
            )
        })
    );
}

/**
Logging instance to use in code.
*/
export const log = winston.createLogger({
    transports,
    exitOnError: false
});

if (fileTransportError) {
    log.warn(
        `Winston file transport could not be initialized (${fileTransportError})`
    );
}

/**
Custom logger instance for fastify
*/
export const fastifyLogger: FastifyBaseLogger = {
    level: getEnv('LOG_LEVEL'),
    info: (msg: unknown) => {
        log.info(msg);
        return fastifyLogger;
    },
    error: (msg: unknown) => {
        log.error(msg);
        return fastifyLogger;
    },
    debug: (msg: unknown) => {
        log.debug(msg);
        return fastifyLogger;
    },
    fatal: (msg: unknown) => {
        log.error(msg);
        return fastifyLogger;
    },
    warn: (msg: unknown) => {
        log.warn(msg);
        return fastifyLogger;
    },
    trace: (msg: unknown) => {
        log.debug(msg);
        return fastifyLogger;
    },
    silent: () => {
        /* deprecated */
    },
    child: () => fastifyLogger
};
