import { customAlphabet } from 'nanoid';
import DayJs from 'dayjs';

import { Prisma } from '../../services/prisma';
import { ForbiddenError } from '../../services/errors';

const generateCode = customAlphabet('1234567890abcdef', 16);

// control an invitation code is valid
// if asked, updated the isUsed field to true on the invitation object
export const controlInvitationCode = async (code: string, updateIsUsed: boolean) => {
    if (!code) {
        throw new ForbiddenError('Missing invitation code');
    }
    const invitation = await Prisma.invitation.findUnique({
        where: {
            code
        }
    });
    if (!invitation) {
        throw new ForbiddenError('Invalid invitation code');
    }
    if (invitation.isUsed) {
        throw new ForbiddenError('Invitation code has already been used');
    }
    if (DayJs(invitation.expire).isBefore(DayJs())) {
        throw new ForbiddenError('Invitation code is expired');
    }
    if (updateIsUsed) {
        await Prisma.invitation.update({
            where: {
                code
            },
            data: {
                isUsed: true
            }
        });
    }
};

// generate a new invitation code
export const generateInvitationCode = () => ({
    code: generateCode(),
    expire: DayJs().add(24, 'hours').toDate(),
    isUsed: false
});
