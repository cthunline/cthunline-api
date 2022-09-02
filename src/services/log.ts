import Path from 'path';
import Fs from 'fs';
import Winston, { format } from 'winston';

import { env } from './env';

const { LOG_ENABLED, LOG_DIR } = env;

const printf = (i: Winston.Logform.TransformableInfo) => (
    `${i.timestamp} [${i.level}] ${i.message}`
);

const timestamp = {
    format: 'YYYY-MM-DD HH:mm:ss'
};

// default log transport in console
const transports: Winston.transport[] = [
    new Winston.transports.Console({
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
if (!LOG_DIR) {
    fileTransportError = 'no log directory provided';
} else {
    try {
        Fs.accessSync(LOG_DIR, Fs.constants.F_OK);
        Fs.accessSync(LOG_DIR, Fs.constants.W_OK);
    } catch (err) {
        fileTransportError = `log directory ${LOG_DIR} does not exist or is not writable`;
    }
}

if (LOG_DIR && !fileTransportError) {
    // log transport in file
    transports.push(
        new Winston.transports.File({
            level: 'info',
            filename: Path.join(LOG_DIR, 'sample-express-ts.log'),
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
const Log = Winston.createLogger({
    transports,
    exitOnError: false,
    silent: LOG_ENABLED
});

if (fileTransportError) {
    Log.warn(`Winston file transport could not be initialized (${fileTransportError})`);
}

export default Log;
