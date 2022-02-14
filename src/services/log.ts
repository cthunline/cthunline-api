import Path from 'path';
import Fs from 'fs';
import Winston, { format } from 'winston';

const isLogEnabled = !!parseInt(process.env.LOG_ENABLED ?? '1');
const logDir = process.env.LOG_DIR;

const printf = (i: Winston.Logform.TransformableInfo) => (
    `${i.timestamp} [${i.level}] ${i.message}`
);

const timestamp = {
    format: 'YYYY-MM-DD HH:mm:ss'
};

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

// controls log directory
let fileTransportError = null;
if (!logDir) {
    fileTransportError = 'no log directory provided';
} else if (!Fs.existsSync(logDir)) {
    fileTransportError = `directory ${logDir} does not exist`;
} else {
    try {
        Fs.accessSync(logDir, Fs.constants.W_OK);
    } catch (err) {
        fileTransportError = `no write permission on ${logDir} directory`;
    }
}

if (logDir && !fileTransportError) {
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

const Log = isLogEnabled ? (
    Winston.createLogger({
        transports,
        exitOnError: false
    })
) : {
    info: () => {},
    warn: () => {},
    error: () => {}
};

if (fileTransportError) {
    Log.warn(`Winston file transport could not be initialized (${fileTransportError})`);
}

export default Log;
