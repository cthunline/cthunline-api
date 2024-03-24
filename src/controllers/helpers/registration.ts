import { eq } from 'drizzle-orm';
import dayjs from 'dayjs';

import { ForbiddenError } from '../../services/errors.js';
import { generateToken } from '../../services/tools.js';
import { db, tables } from '../../services/db.js';

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
    const invitations = await db
        .select()
        .from(tables.invitations)
        .where(eq(tables.invitations.code, code));
    const invitation = invitations[0];
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
        await db
            .update(tables.invitations)
            .set({
                isUsed: true
            })
            .where(eq(tables.invitations.code, code));
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
