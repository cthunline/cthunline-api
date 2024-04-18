import {
    type FastifyInstance,
    type FastifyRequest,
    type FastifyReply
} from 'fastify';

import { getSessionByIdOrThrow } from '../services/queries/session.js';
import { ConflictError, InternError } from '../services/errors.js';
import { parseParamId } from '../services/api.js';
import { type Note } from '../drizzle/schema.js';
import { controlSelf } from './helpers/auth.js';
import {
    createNoteSchema,
    type CreateNoteBody,
    updateNoteSchema,
    type UpdateNoteBody
} from './schemas/note.js';
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
            await getSessionByIdOrThrow(sessionId);
            const notes = await getUserSessionNotes(user.id, sessionId);
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
            const note = await getUserNoteByIdOrThrow(user.id, noteId);
            rep.send(note);
        }
    });

    // updates a note
    app.route({
        method: 'PATCH',
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
            const note = await getUserNoteByIdOrThrow(user.id, noteId);
            controlSelf(note.userId, user);
            const updatedNote = await updateNoteById(noteId, body);
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
            const note = await getUserNoteByIdOrThrow(user.id, noteId);
            controlSelf(note.userId, user);
            let positionToSwitch: number;
            if (params.action === 'down') {
                const maxPosition = await getUserSessionNoteMaxPosition(
                    user.id,
                    note.sessionId
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
            await switchUserSessionNotesPositions(
                user.id,
                note.sessionId,
                note.position,
                positionToSwitch
            );
            const updatedNote = await getUserNoteByIdOrThrow(user.id, noteId);
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
            const note = await getUserNoteByIdOrThrow(user.id, noteId);
            controlSelf(note.userId, user);
            await deleteNoteById(noteId);
            // re-order note positions
            await reorderUserSessionNotes(user.id, note.sessionId);
            //
            rep.send({});
        }
    });
};
