import winston, { format } from 'winston';
import path from 'path';
import fs from 'fs';

import { getEnv } from './env.js';

const printf = (i: winston.Logform.TransformableInfo) =>
    `${i.timestamp} [${i.level}] ${i.message}`;

const timestamp = {
    format: 'YYYY-MM-DD HH:mm:ss'
};

// default log transport in console
const transports: winston.transport[] = [
    new winston.transports.Console({
        level: 'info',
        handleExceptions: false,
        format: format.combine(
            format.colorize(),
            format.timestamp(timestamp),
            format.printf(printf)
        )
    })
];

// control log file directory exists and is writable
let fileTransportError = null;
const logDir = getEnv('LOG_DIR');
if (!logDir) {
    fileTransportError = 'no log directory provided';
} else {
    try {
        fs.accessSync(logDir, fs.constants.F_OK);
        fs.accessSync(logDir, fs.constants.W_OK);
    } catch (err) {
        fileTransportError = `log directory ${getEnv(
            'LOG_DIR'
        )} does not exist or is not writable`;
    }
}

if (logDir && !fileTransportError) {
    // log transport in file
    transports.push(
        new winston.transports.File({
            level: 'info',
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

// logging instance to use in code
export const log = winston.createLogger({
    transports,
    exitOnError: false,
    silent: !getEnv('LOG_ENABLED')
});

if (fileTransportError) {
    log.warn(
        `Winston file transport could not be initialized (${fileTransportError})`
    );
}
