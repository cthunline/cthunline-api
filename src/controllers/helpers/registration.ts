import dayjs from 'dayjs';

import { ForbiddenError } from '../../services/errors.js';
import {
    getInvitationByCode,
    updateInvitationByCode
} from '../../services/queries/invitation.js';
import { generateToken } from '../../services/tools.js';

/**
Checks that an invitation code is valid.
If asked, updated the isUsed field to true on the invitation object.
*/
export const controlInvitationCode = async (
    code: string,
    updateIsUsed: boolean
) => {
    if (!code) {
        throw new ForbiddenError('Missing invitation code');
    }
    const invitation = await getInvitationByCode(code);
    if (!invitation) {
        throw new ForbiddenError('Invalid invitation code');
    }
    if (invitation.isUsed) {
        throw new ForbiddenError('Invitation code has already been used');
    }
    if (dayjs(invitation.expire).isBefore(dayjs())) {
        throw new ForbiddenError('Invitation code is expired');
    }
    if (updateIsUsed) {
        await updateInvitationByCode(code, {
            isUsed: true
        });
    }
};

/**
Generates a new invitation code.
*/
export const generateInvitationCode = () => ({
    code: generateToken(16),
    expire: dayjs().add(24, 'hours').toDate(),
    isUsed: false
});
