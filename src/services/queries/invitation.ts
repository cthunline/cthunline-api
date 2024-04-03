import { eq } from 'drizzle-orm';

import {
    type InvitationInsert,
    type InvitationUpdate
} from '../../drizzle/schema.js';
import { db, tables } from '../db.js';
import { InternError } from '../errors.js';

/**
Gets an invitation with the given code.
*/
export const getInvitationByCode = async (code: string) => {
    const invitations = await db
        .select()
        .from(tables.invitations)
        .where(eq(tables.invitations.code, code));
    if (invitations[0]) {
        return invitations[0];
    }
    return null;
};

/**
Creates an invitation.
*/
export const createInvitation = async (data: InvitationInsert) => {
    const createdInvitations = await db
        .insert(tables.invitations)
        .values(data)
        .returning();
    const createdInvitation = createdInvitations[0];
    if (!createdInvitation) {
        throw new InternError('Could not retreive inserted invitation');
    }
    return createdInvitation;
};

/**
Updates an invitation with the given code.
*/
export const updateInvitationByCode = async (
    code: string,
    data: InvitationUpdate
) => {
    await db
        .update(tables.invitations)
        .set(data)
        .where(eq(tables.invitations.code, code));
};
