import Path from 'path';
import Fs from 'fs';
import Winston, { format } from 'winston';

import { configuration } from './configuration';

const { LOG_ENABLED, LOG_DIR } = configuration;

const isLogEnabled = LOG_ENABLED;
const logDir = LOG_DIR;

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
if (!logDir) {
    fileTransportError = 'no log directory provided';
} else {
    try {
        Fs.accessSync(logDir, Fs.constants.F_OK);
        Fs.accessSync(logDir, Fs.constants.W_OK);
    } catch (err) {
        fileTransportError = `log directory ${logDir} does not exist or is not writable`;
    }
}

if (logDir && !fileTransportError) {
    // log transport in file
    transports.push(
        new Winston.transports.File({
            level: 'info',
            filename: Path.join(logDir, 'sample-express-ts.log'),
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
// if logging is disabled return a fake log object
const Log = isLogEnabled ? (
    Winston.createLogger({
        transports,
        exitOnError: false
    })
) : {
    info: () => { /* silent log */ },
    warn: () => { /* silent log */ },
    error: () => { /* silent log */ }
};

if (fileTransportError) {
    Log.warn(`Winston file transport could not be initialized (${fileTransportError})`);
}

export default Log;
