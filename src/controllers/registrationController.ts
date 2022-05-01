import {
    Router,
    Request,
    Response
} from 'express';

import { Prisma } from '../services/prisma';
import { hashPassword } from '../services/controllerServices/auth';
import { ForbiddenError } from '../services/errors';
import Validator from '../services/validator';
import rateLimiter from '../services/rateLimiter';
import {
    isRegistrationEnabled,
    isInvitationEnabled
} from '../services/configuration';
import {
    userSelect,
    controlUniqueEmail,
    defaultUserData
} from '../services/controllerServices/user';
import {
    controlInvitationCode,
    generateInvitationCode
} from '../services/controllerServices/registration';

import UserSchemas from './schemas/user.json';

const validateRegisterUser = Validator(UserSchemas.register);

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
registrationController.post('/invitation', async (req: Request, res: Response): Promise<void> => {
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
