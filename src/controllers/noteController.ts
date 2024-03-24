import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, sql } from 'drizzle-orm';

import { ConflictError, InternError } from '../services/errors.js';
import { getSessionOrThrow } from './helpers/session.js';
import { parseParamId } from '../services/api.js';
import { type Note } from '../drizzle/schema.js';
import { controlSelf } from './helpers/auth.js';
import { db, tables } from '../services/db.js';
import {
    createNoteSchema,
    type CreateNoteBody,
    updateNoteSchema,
    type UpdateNoteBody
} from './schemas/note.js';
import {
    getNotes,
    getMaxNotePosition,
    getNextNotePosition,
    switchNotePositions,
    getNoteOrThrow
} from './helpers/note.js';

export const noteController = async (app: FastifyInstance) => {
    // get current user's notes in a session
    // also returns shared notes in a separate list
    app.route({
        method: 'GET',
        url: '/sessions/:sessionId/notes',
        handler: async (
            {
                params,
                user
            }: FastifyRequest<{
                Params: {
                    sessionId: string;
                };
            }>,
            rep: FastifyReply
        ) => {
            const sessionId = parseParamId(params, 'sessionId');
            await getSessionOrThrow(sessionId);
            const notes = await getNotes(sessionId, user.id);
            const userNotes: Note[] = [];
            const sharedNotes: Note[] = [];
            notes.forEach((note) => {
                if (note.userId === user.id) {
                    userNotes.push(note);
                } else {
                    sharedNotes.push(note);
                }
            });
            rep.send({
                notes: userNotes,
                sharedNotes
            });
        }
    });

    // creates a new note in a session for the current user
    app.route({
        method: 'POST',
        url: '/sessions/:sessionId/notes',
        schema: { body: createNoteSchema },
        handler: async (
            {
                params,
                body,
                user
            }: FastifyRequest<{
                Params: {
                    sessionId: string;
                };
                Body: CreateNoteBody;
            }>,
            rep: FastifyReply
        ) => {
            const sessionId = parseParamId(params, 'sessionId');
            await getSessionOrThrow(sessionId);
            const position = await getNextNotePosition(sessionId, user.id);
            const createdNotes = await db
                .insert(tables.notes)
                .values({
                    position,
                    isShared: body.isShared ?? false,
                    title: body.title,
                    text: body.text ?? '',
                    sessionId,
                    userId: user.id
                })
                .returning();
            const note = createdNotes[0];
            if (!note) {
                throw new InternError('Could not retreive inserted note');
            }
            rep.send(note);
        }
    });

    // get a note
    app.route({
        method: 'GET',
        url: '/notes/:noteId',
        handler: async (
            {
                params,
                user
            }: FastifyRequest<{
                Params: {
                    noteId: string;
                };
            }>,
            rep: FastifyReply
        ) => {
            const noteId = parseParamId(params, 'noteId');
            const note = await getNoteOrThrow(noteId, user.id);
            rep.send(note);
        }
    });

    // updates a note
    app.route({
        method: 'POST',
        url: '/notes/:noteId',
        schema: { body: updateNoteSchema },
        handler: async (
            {
                params,
                body,
                user
            }: FastifyRequest<{
                Params: {
                    nodeId: string;
                };
                Body: UpdateNoteBody;
            }>,
            rep: FastifyReply
        ) => {
            const noteId = parseParamId(params, 'noteId');
            const note = await getNoteOrThrow(noteId, user.id);
            controlSelf(note.userId, user);
            const updatedNotes = await db
                .update(tables.notes)
                .set(body)
                .where(eq(tables.notes.id, noteId))
                .returning();
            const updatedNote = updatedNotes[0];
            if (!updatedNote) {
                throw new InternError('Could not retreive updated note');
            }
            rep.send(updatedNote);
        }
    });

    // moves a note position up or down in the note list
    // up -> decrease position
    // down -> increase position
    app.route({
        method: 'PUT',
        url: '/notes/:noteId/:action(up|down)',
        handler: async (
            {
                params,
                user
            }: FastifyRequest<{
                Params: {
                    nodeId: string;
                    action: 'up' | 'down';
                };
                Body: UpdateNoteBody;
            }>,
            rep: FastifyReply
        ) => {
            const noteId = parseParamId(params, 'noteId');
            const note = await getNoteOrThrow(noteId, user.id);
            controlSelf(note.userId, user);
            let positionToSwitch: number;
            if (params.action === 'down') {
                const maxPosition = await getMaxNotePosition(
                    note.sessionId,
                    user.id
                );
                if (note.position < maxPosition) {
                    positionToSwitch = note.position + 1;
                } else {
                    throw new ConflictError('Note cannot go down no more');
                }
            } else if (params.action === 'up') {
                if (note.position > 1) {
                    positionToSwitch = note.position - 1;
                } else {
                    throw new ConflictError('Note cannot go up no more');
                }
            } else {
                throw new InternError(
                    `Unexpected ${params.action} action parameter`
                );
            }
            await switchNotePositions(
                note.sessionId,
                user.id,
                note.position,
                positionToSwitch
            );
            const updatedNote = await getNoteOrThrow(noteId, user.id);
            rep.send(updatedNote);
        }
    });

    // deletes a note
    app.route({
        method: 'DELETE',
        url: '/notes/:noteId',
        handler: async (
            {
                params,
                user
            }: FastifyRequest<{
                Params: {
                    nodeId: string;
                };
                Body: UpdateNoteBody;
            }>,
            rep: FastifyReply
        ) => {
            const noteId = parseParamId(params, 'noteId');
            const note = await getNoteOrThrow(noteId, user.id);
            controlSelf(note.userId, user);
            await db.delete(tables.notes).where(eq(tables.notes.id, noteId));
            // re-order note positions
            await db.execute(sql`with ordered_notes as (
                select id, row_number() over (order by position) as new_position
                from notes
                where session_id = ${note.sessionId} and user_id = ${user.id}
            )
            update notes
            set position = ordered_notes.new_position
            from ordered_notes
            where notes.id = ordered_notes.id;`);
            //
            rep.send({});
        }
    });
};
