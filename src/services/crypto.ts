import Jwt, { JwtPayload } from 'jsonwebtoken';
import Crypto from 'crypto';
import Bcrypt from 'bcrypt';

import { AppErrorConstructor, AuthenticationError } from './errors';
import { getEnv } from './env';

import { SafeUser } from '../types/user';

// hash a string
export const hashPassword = async (password: string): Promise<string> =>
    Bcrypt.hash(password, 10);

// validate hash against string
export const verifyPassword = async (
    password: string,
    hash: string
): Promise<boolean> => {
    const verify = await Bcrypt.compare(password, hash);
    return !!verify;
};

export const generateJwt = (user: SafeUser) =>
    Jwt.sign(user, getEnv('JWT_SECRET'), { expiresIn: '12h' });

export const verifyJwt = (jwt: string): SafeUser & JwtPayload => {
    try {
        return Jwt.verify(jwt, getEnv('JWT_SECRET')) as SafeUser & JwtPayload;
    } catch {
        throw new AuthenticationError();
    }
};

// algorithm used for encryption / decryption (recommanded as other types (CBC, CTR) are insecure)
const cryptoAlgo = 'aes-256-gcm';
// recommanded initialization vector length for GCM
const cryptoIvLength = 12;

/**
Encrypt a string with a secret
*/
export const encrypt = (
    str: string,
    secret: string,
    ErrorClass?: AppErrorConstructor
): string => {
    try {
        const initVectorBuffer = Crypto.randomBytes(cryptoIvLength);
        const secretBuffer = Buffer.from(secret);
        const cipher = Crypto.createCipheriv(
            cryptoAlgo,
            secretBuffer,
            initVectorBuffer
        );
        return Buffer.concat([
            cipher.update(str),
            cipher.final(),
            cipher.getAuthTag(),
            initVectorBuffer
        ]).toString('base64');
    } catch (err) {
        if (ErrorClass) {
            throw new ErrorClass();
        }
        throw err;
    }
};

/**
Decrypt a string with a secret
*/
export const decrypt = (
    str: string,
    secret: string,
    ErrorClass?: AppErrorConstructor
): string => {
    try {
        const secretBuffer = Buffer.from(secret);
        const buffer = Buffer.from(str, 'base64');
        const encryptedBuffer = buffer.subarray(0, buffer.length - 28);
        const authTagBuffer = buffer.subarray(
            buffer.length - 28,
            buffer.length - 16
        );
        const initVectorBuffer = buffer.subarray(buffer.length - 12);
        const decipher = Crypto.createDecipheriv(
            cryptoAlgo,
            secretBuffer,
            initVectorBuffer
        );
        decipher.setAuthTag(authTagBuffer);
        return Buffer.concat([
            decipher.update(encryptedBuffer),
            decipher.final()
        ]).toString();
    } catch (err) {
        if (ErrorClass) {
            throw new ErrorClass();
        }
        throw err;
    }
};
