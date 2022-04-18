import {
    Router,
    Request,
    Response
} from 'express';
import { customAlphabet } from 'nanoid';

import { Prisma } from '../services/prisma';
import { hashPassword } from '../services/auth';
import { ForbiddenError } from '../services/errors';
import Validator from '../services/validator';
import {
    isRegistrationEnabled,
    isInvitationEnabled
} from '../services/configuration';
import {
    userSelect,
    controlUniqueEmail
} from '../services/user';

import UserSchemas from './schemas/user.json';

const validateRegisterUser = Validator(UserSchemas.register);

const generateCode = customAlphabet('1234567890abcdef', 16);

const registrationController = Router();

// register a new user
registrationController.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { body } = req;
        if (!isRegistrationEnabled()) {
            throw new ForbiddenError('Registration is disabled');
        }
        validateRegisterUser(body);
        if (isInvitationEnabled()) {
            if (!body.invitationCode) {
                throw new ForbiddenError('Missing invitation code');
            }
            const invitation = await Prisma.invitation.findUnique({
                where: {
                    code: body.invitationCode
                }
            });
            if (!invitation) {
                throw new ForbiddenError('Invalid invitation code');
            }
            if (invitation.isUsed) {
                throw new ForbiddenError('Invitation code has already been used');
            }
        }
        await controlUniqueEmail(body.email);
        const hashedPassword = await hashPassword(body.password);
        const {
            password,
            invitationCode,
            ...cleanBody
        } = body;
        if (invitationCode) {
            await Prisma.invitation.update({
                where: {
                    code: invitationCode
                },
                data: {
                    isUsed: true
                }
            });
        }
        const user = await Prisma.user.create({
            select: userSelect,
            data: {
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
            data: {
                code: generateCode(),
                isUsed: false
            }
        });
        res.json({ code });
    } catch (err: any) {
        res.error(err);
    }
});

export default registrationController;
