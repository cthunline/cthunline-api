import DayJs from 'dayjs';

import { ForbiddenError } from '../../services/errors.js';
import { generateToken } from '../../services/tools.js';
import { prisma } from '../../services/prisma.js';

// control an invitation code is valid
// if asked, updated the isUsed field to true on the invitation object
export const controlInvitationCode = async (
    code: string,
    updateIsUsed: boolean
) => {
    if (!code) {
        throw new ForbiddenError('Missing invitation code');
    }
    const invitation = await prisma.invitation.findUnique({
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
        await prisma.invitation.update({
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
    code: generateToken(16),
    expire: DayJs().add(24, 'hours').toDate(),
    isUsed: false
});
