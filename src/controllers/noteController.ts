import {
    Router,
    Request,
    Response
} from 'express';

import { Prisma } from '../services/prisma';
import Validator from '../services/validator';
import { getSession } from './helpers/session';
import {
    getNotes,
    getNote,
    getMaxNotePosition,
    getNextNotePosition,
    switchNotePositions
} from './helpers/note';
import { controlSelf } from './helpers/auth';
import { ConflictError, InternError } from '../services/errors';

import noteSchemas from './schemas/note.json';

const validateCreateNote = Validator(noteSchemas.create);
const validateUpdateNote = Validator(noteSchemas.update);

const noteController = Router();

// get current user's notes in a session
// also returns shared notes in a separate list
noteController.get('/sessions/:sessionId/notes', async ({ params, query, user }: Request, res: Response): Promise<void> => {
    try {
        const sessionId = Number(params.sessionId);
        await getSession(sessionId);
        const notes = await getNotes(
            sessionId,
            user.id,
            query.include === 'true'
        );
        res.json({
            notes: notes.filter(({ userId }) => userId === user.id),
            sharedNotes: notes.filter(({ userId }) => userId !== user.id)
        });
    } catch (err: any) {
        res.error(err);
    }
});

// creates a new note in a session for the current user
noteController.post('/sessions/:sessionId/notes', async ({ params, body, user }: Request, res: Response): Promise<void> => {
    try {
        validateCreateNote(body);
        const sessionId = Number(params.sessionId);
        await getSession(sessionId);
        const position = await getNextNotePosition(sessionId, user.id);
        const note = await Prisma.note.create({
            data: {
                position,
                isShared: body.isShared ?? false,
                title: body.title,
                text: body.text ?? '',
                sessionId,
                userId: user.id
            }
        });
        res.json(note);
    } catch (err: any) {
        res.error(err);
    }
});

// get a note
noteController.get('/notes/:noteId', async ({ params, user }: Request, res: Response): Promise<void> => {
    try {
        const noteId = Number(params.noteId);
        const note = await getNote(noteId, user.id);
        res.json(note);
    } catch (err: any) {
        res.error(err);
    }
});

// updates a note
noteController.post('/notes/:noteId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { params, body, user } = req;
        validateUpdateNote(body);
        const noteId = Number(params.noteId);
        const note = await getNote(noteId, user.id);
        controlSelf(req, note.userId);
        const updatedNote = await Prisma.note.update({
            data: body,
            where: {
                id: noteId
            }
        });
        res.json(updatedNote);
    } catch (err: any) {
        res.error(err);
    }
});

// moves a note position up or down in the note list
// up -> decrease position
// down -> increase position
noteController.put('/notes/:noteId/:action(up|down)', async (req: Request, res: Response): Promise<void> => {
    try {
        const { params, user } = req;
        const noteId = Number(params.noteId);
        const note = await getNote(noteId, user.id);
        controlSelf(req, note.userId);
        let positionToSwitch: number;
        if (params.action === 'down') {
            const maxPosition = await getMaxNotePosition(note.sessionId, user.id);
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
            throw new InternError(`Unexpected ${params.action} action parameter`);
        }
        await switchNotePositions(
            note.sessionId,
            user.id,
            note.position,
            positionToSwitch
        );
        const updatedNote = await getNote(noteId, user.id);
        res.json(updatedNote);
    } catch (err: any) {
        res.error(err);
    }
});

// deletes a note
noteController.delete('/notes/:noteId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { params, user } = req;
        const noteId = Number(params.noteId);
        const note = await getNote(noteId, user.id);
        controlSelf(req, note.userId);
        await Prisma.note.delete({
            where: {
                id: noteId
            }
        });
        // re-order note positions
        const notes = await Prisma.note.findMany({
            where: {
                sessionId: note.sessionId,
                userId: user.id
            },
            orderBy: [{
                position: 'asc'
            }]
        });
        if (notes.length) {
            await Prisma.$transaction(
                notes.map(({ id }, index) => (
                    Prisma.note.update({
                        data: {
                            position: index + 1
                        },
                        where: {
                            id
                        }
                    })
                ))
            );
        }
        //
        res.send({});
    } catch (err: any) {
        res.error(err);
    }
});

export default noteController;
