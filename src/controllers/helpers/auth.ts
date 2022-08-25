import { Request, CookieOptions } from 'express';
import DaysJs from 'dayjs';

import { env } from '../../services/env';
import { ForbiddenError } from '../../services/errors';

const { COOKIE_SECURE } = env;

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
export const controlSelf = (req: Request, userId: number) => {
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
