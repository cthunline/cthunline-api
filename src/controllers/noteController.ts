import { Type } from '@sinclair/typebox';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import type { Note } from '../drizzle/schema.js';
import { ConflictError, InternError } from '../services/errors.js';
import {
    createNote,
    deleteNoteById,
    getUserNoteByIdOrThrow,
    getUserSessionNoteMaxPosition,
    getUserSessionNoteNextPosition,
    getUserSessionNotes,
    reorderUserSessionNotes,
    switchUserSessionNotesPositions,
    updateNoteById
} from '../services/queries/note.js';
import { getSessionByIdOrThrow } from '../services/queries/session.js';
import { controlSelf } from './helpers/auth.js';
import { deleteCachedNote, updateCachedNoteIfExists } from './helpers/note.js';
import {
    type CreateNoteBody,
    type UpdateNoteBody,
    createNoteSchema,
    updateNoteSchema
} from './schemas/note.js';
import {
    type NoteActionParams,
    type NoteIdParams,
    type SessionIdParams,
    noteActionSchema,
    noteIdSchema,
    sessionIdSchema
} from './schemas/params.js';

export const noteController = async (app: FastifyInstance) => {
    // biome-ignore lint/suspicious/useAwait: fastify controllers require async

    // get current user's notes in a session
    // also returns shared notes in a separate list
    app.route({
        method: 'GET',
        url: '/sessions/:sessionId/notes',
        schema: {
            params: sessionIdSchema
        },
        handler: async (
            {
                params: { sessionId },
                user
            }: FastifyRequest<{
                Params: SessionIdParams;
            }>,
            rep: FastifyReply
        ) => {
            await getSessionByIdOrThrow(sessionId);
            const notes = await getUserSessionNotes(user.id, sessionId);
            const userNotes: Note[] = [];
            const sharedNotes: Note[] = [];
            for (const note of notes) {
                if (note.userId === user.id) {
                    userNotes.push(note);
                } else {
                    sharedNotes.push(note);
                }
            }
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
        schema: {
            params: sessionIdSchema,
            body: createNoteSchema
        },
        handler: async (
            {
                params: { sessionId },
                body,
                user
            }: FastifyRequest<{
                Params: SessionIdParams;
                Body: CreateNoteBody;
            }>,
            rep: FastifyReply
        ) => {
            await getSessionByIdOrThrow(sessionId);
            const position = await getUserSessionNoteNextPosition(
                user.id,
                sessionId
            );
            const createdNote = await createNote({
                position,
                isShared: body.isShared ?? false,
                title: body.title,
                text: body.text ?? '',
                sessionId,
                userId: user.id
            });
            rep.send(createdNote);
        }
    });

    // get a note
    app.route({
        method: 'GET',
        url: '/notes/:noteId',
        schema: {
            params: noteIdSchema
        },
        handler: async (
            {
                params: { noteId },
                user
            }: FastifyRequest<{
                Params: NoteIdParams;
            }>,
            rep: FastifyReply
        ) => {
            const note = await getUserNoteByIdOrThrow(user.id, noteId);
            rep.send(note);
        }
    });

    // updates a note
    app.route({
        method: 'PATCH',
        url: '/notes/:noteId',
        schema: {
            params: noteIdSchema,
            body: updateNoteSchema
        },
        handler: async (
            {
                params: { noteId },
                body,
                user
            }: FastifyRequest<{
                Params: NoteIdParams;
                Body: UpdateNoteBody;
            }>,
            rep: FastifyReply
        ) => {
            const note = await getUserNoteByIdOrThrow(user.id, noteId);
            controlSelf(note.userId, user);
            const updatedNote = await updateNoteById(noteId, body);
            await updateCachedNoteIfExists(updatedNote);
            rep.send(updatedNote);
        }
    });

    // moves a note position up or down in the note list
    // up -> decrease position
    // down -> increase position
    app.route({
        method: 'PUT',
        url: '/notes/:noteId/:action(up|down)',
        schema: {
            params: Type.Composite([noteIdSchema, noteActionSchema], {
                additionalProperties: false
            })
        },
        handler: async (
            {
                params: { noteId, action },
                user
            }: FastifyRequest<{
                Params: NoteIdParams & NoteActionParams;
                Body: UpdateNoteBody;
            }>,
            rep: FastifyReply
        ) => {
            const note = await getUserNoteByIdOrThrow(user.id, noteId);
            controlSelf(note.userId, user);
            let positionToSwitch: number;
            if (action === 'down') {
                const maxPosition = await getUserSessionNoteMaxPosition(
                    user.id,
                    note.sessionId
                );
                if (note.position < maxPosition) {
                    positionToSwitch = note.position + 1;
                } else {
                    throw new ConflictError('Note cannot go down no more');
                }
            } else if (action === 'up') {
                if (note.position > 1) {
                    positionToSwitch = note.position - 1;
                } else {
                    throw new ConflictError('Note cannot go up no more');
                }
            } else {
                throw new InternError(`Unexpected ${action} action parameter`);
            }
            await switchUserSessionNotesPositions(
                user.id,
                note.sessionId,
                note.position,
                positionToSwitch
            );
            const updatedNote = await getUserNoteByIdOrThrow(user.id, noteId);
            await updateCachedNoteIfExists(updatedNote);
            rep.send(updatedNote);
        }
    });

    // deletes a note
    app.route({
        method: 'DELETE',
        url: '/notes/:noteId',
        schema: {
            params: noteIdSchema
        },
        handler: async (
            {
                params: { noteId },
                user
            }: FastifyRequest<{
                Params: NoteIdParams;
                Body: UpdateNoteBody;
            }>,
            rep: FastifyReply
        ) => {
            const note = await getUserNoteByIdOrThrow(user.id, noteId);
            controlSelf(note.userId, user);
            await deleteNoteById(noteId);
            await deleteCachedNote(noteId);
            // re-order note positions
            await reorderUserSessionNotes(user.id, note.sessionId);
            //
            rep.send({});
        }
    });
};
