import { Request, CookieOptions } from 'express';
import Jwt from 'jsonwebtoken';
import DaysJs from 'dayjs';

import { configuration } from '../configuration';
import {
    AuthenticationError,
    ForbiddenError
} from '../errors';

const Bcrypt = require('bcrypt');

const { JWT_SECRET, COOKIE_SECURE } = configuration;

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
    Jwt.sign(user, JWT_SECRET ?? '', { expiresIn: '12h' })
);

export const verifyJwt = <DataType extends object>(token: string): DataType => {
    try {
        return Jwt.verify(token, JWT_SECRET ?? '') as DataType;
    } catch {
        throw new AuthenticationError();
    }
};

// returns options object for cookies
export const getCookieOptions = (): CookieOptions => ({
    httpOnly: true,
    signed: true,
    secure: COOKIE_SECURE,
    sameSite: true,
    expires: DaysJs().add(12, 'hours').toDate()
});

// control userId in params is same as authentified one
// if not throw forbidden error
export const controlSelf = (req: Request, userId: string) => {
    if (userId !== req.user.id) {
        throw new ForbiddenError();
    }
};

// check currently authenticated user is an admin
export const controlSelfAdmin = ({ user }: Request) => {
    if (!user.isAdmin) {
        throw new ForbiddenError();
    }
};
