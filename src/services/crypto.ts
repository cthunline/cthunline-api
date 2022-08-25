import Jwt from 'jsonwebtoken';

import { env } from './env';
import { AuthenticationError } from './errors';

const Bcrypt = require('bcrypt');

const { JWT_SECRET } = env;

// hash a string
export const hashPassword = async (password: string): Promise<string> => (
    Bcrypt.hash(password, 10)
);

// validate hash against string
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    const verify = await Bcrypt.compare(password, hash);
    return !!verify;
};

export const generateJwt = <DataType extends object>(user: DataType) => (
    Jwt.sign(user, JWT_SECRET, { expiresIn: '12h' })
);

export const verifyJwt = <DataType extends object>(token: string): DataType => {
    try {
        return Jwt.verify(token, JWT_SECRET) as DataType;
    } catch {
        throw new AuthenticationError();
    }
};
