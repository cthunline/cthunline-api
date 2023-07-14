import Path from 'path';
import Fs from 'fs';
import Winston, { format } from 'winston';

import { getEnv } from './env';

const printf = (i: Winston.Logform.TransformableInfo) =>
    `${i.timestamp} [${i.level}] ${i.message}`;

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
const logDir = getEnv('LOG_DIR');
if (!logDir) {
    fileTransportError = 'no log directory provided';
} else {
    try {
        Fs.accessSync(logDir, Fs.constants.F_OK);
        Fs.accessSync(logDir, Fs.constants.W_OK);
    } catch (err) {
        fileTransportError = `log directory ${getEnv(
            'LOG_DIR'
        )} does not exist or is not writable`;
    }
}

if (logDir && !fileTransportError) {
    // log transport in file
    transports.push(
        new Winston.transports.File({
            level: 'info',
            filename: Path.join(logDir, 'cthunline.log'),
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
    silent: !getEnv('LOG_ENABLED')
});

if (fileTransportError) {
    Log.warn(
        `Winston file transport could not be initialized (${fileTransportError})`
    );
}

export default Log;
