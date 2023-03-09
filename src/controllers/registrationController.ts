import {
    Router,
    Request,
    Response
} from 'express';

import { ForbiddenError } from '../services/errors';
import rateLimiter from '../services/rateLimiter';
import { hashPassword } from '../services/crypto';
import Validator from '../services/validator';
import { Prisma } from '../services/prisma';
import {
    controlInvitationCode,
    generateInvitationCode
} from './helpers/registration';
import {
    isRegistrationEnabled,
    isInvitationEnabled
} from '../services/env';
import {
    userSelect,
    controlUniqueEmail,
    defaultUserData
} from './helpers/user';

import userSchemas from './schemas/user.json';

const validateRegisterUser = Validator(userSchemas.register);

const registrationController = Router();

// register a new user
registrationController.post('/register', rateLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const { body } = req;
        if (!isRegistrationEnabled()) {
            throw new ForbiddenError('Registration is disabled');
        }
        validateRegisterUser(body);
        if (isInvitationEnabled()) {
            await controlInvitationCode(body.invitationCode, true);
        }
        await controlUniqueEmail(body.email);
        const hashedPassword = await hashPassword(body.password);
        const {
            password,
            invitationCode,
            ...cleanBody
        } = body;
        const user = await Prisma.user.create({
            select: userSelect,
            data: {
                ...defaultUserData,
                ...cleanBody,
                password: hashedPassword
            }
        });
        res.json(user);
    } catch (err: any) {
        res.error(err);
    }
});

// generate a new invitation
registrationController.post('/invitation', async (_req: Request, res: Response): Promise<void> => {
    try {
        if (!isRegistrationEnabled()) {
            throw new ForbiddenError('Registration is disabled');
        }
        if (!isInvitationEnabled()) {
            throw new ForbiddenError('Invitation codes are disabled');
        }
        const { code } = await Prisma.invitation.create({
            data: generateInvitationCode()
        });
        res.json({ code });
    } catch (err: any) {
        res.error(err);
    }
});

export default registrationController;
