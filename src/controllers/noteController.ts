import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { ConflictError, InternError } from '../services/errors.js';
import { parseParamId } from '../services/api.js';
import { prisma } from '../services/prisma.js';

import { getSession } from './helpers/session.js';
import { controlSelf } from './helpers/auth.js';
import {
    getNotes,
    getNote,
    getMaxNotePosition,
    getNextNotePosition,
    switchNotePositions
} from './helpers/note.js';

import { QueryParam } from '../types/api.js';

import {
    createNoteSchema,
    CreateNoteBody,
    updateNoteSchema,
    UpdateNoteBody
} from './schemas/note.js';

export const noteController = async (app: FastifyInstance) => {
    // get current user's notes in a session
    // also returns shared notes in a separate list
    app.route({
        method: 'GET',
        url: '/sessions/:sessionId/notes',
        handler: async (
            {
                params,
                user,
                query
            }: FastifyRequest<{
                Params: {
                    sessionId: string;
                };
                Querystring: {
                    include?: QueryParam;
                };
            }>,
            rep: FastifyReply
        ) => {
            const sessionId = parseParamId(params, 'sessionId');
            await getSession(sessionId);
            const notes = await getNotes(
                sessionId,
                user.id,
                query.include === 'true'
            );
            rep.send({
                notes: notes.filter(({ userId }) => userId === user.id),
                sharedNotes: notes.filter(({ userId }) => userId !== user.id)
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
            await getSession(sessionId);
            const position = await getNextNotePosition(sessionId, user.id);
            const note = await prisma.note.create({
                data: {
                    position,
                    isShared: body.isShared ?? false,
                    title: body.title,
                    text: body.text ?? '',
                    sessionId,
                    userId: user.id
                }
            });
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
            const note = await getNote(noteId, user.id);
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
            const note = await getNote(noteId, user.id);
            controlSelf(note.userId, user);
            const updatedNote = await prisma.note.update({
                data: body,
                where: {
                    id: noteId
                }
            });
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
            const note = await getNote(noteId, user.id);
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
            const updatedNote = await getNote(noteId, user.id);
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
            const note = await getNote(noteId, user.id);
            controlSelf(note.userId, user);
            await prisma.note.delete({
                where: {
                    id: noteId
                }
            });
            // re-order note positions
            const notes = await prisma.note.findMany({
                where: {
                    sessionId: note.sessionId,
                    userId: user.id
                },
                orderBy: [
                    {
                        position: 'asc'
                    }
                ]
            });
            if (notes.length) {
                await prisma.$transaction(
                    notes.map(({ id }, index) =>
                        prisma.note.update({
                            data: {
                                position: index + 1
                            },
                            where: {
                                id
                            }
                        })
                    )
                );
            }
            //
            rep.send({});
        }
    });
};
