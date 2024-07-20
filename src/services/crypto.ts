import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt, { type JwtPayload } from 'jsonwebtoken';

import type { SafeUser } from '../drizzle/schema.js';
import { getEnv } from './env.js';
import { type AppErrorConstructor, AuthenticationError } from './errors.js';

/**
Hashes a string.
*/
export const hashPassword = async (password: string): Promise<string> =>
    bcrypt.hash(password, 10);

/**
Validate hash against string.
*/
export const verifyPassword = async (
    password: string,
    hash: string
): Promise<boolean> => {
    const verify = await bcrypt.compare(password, hash);
    return !!verify;
};

export const generateJwt = (user: SafeUser) =>
    jwt.sign(user, getEnv('JWT_SECRET'), { expiresIn: '12h' });

export const verifyJwt = (token: string): SafeUser & JwtPayload => {
    try {
        return jwt.verify(token, getEnv('JWT_SECRET')) as SafeUser & JwtPayload;
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
        const initVectorBuffer = crypto.randomBytes(cryptoIvLength);
        const secretBuffer = Buffer.from(secret);
        const cipher = crypto.createCipheriv(
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
        const decipher = crypto.createDecipheriv(
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
