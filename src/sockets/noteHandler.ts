import { getNoteCacheKey } from '../controllers/helpers/note.js';
import type { Note } from '../drizzle/schema.js';
import { cache } from '../services/cache.js';
import { ForbiddenError } from '../services/errors.js';
import { getUserNoteByIdOrThrow } from '../services/queries/note.js';
import { validateSchema } from '../services/typebox.js';
import type { SocketIoServer, SocketIoSocket } from '../types/socket.js';
import { meta } from './helper.js';
import {
    type NoteSocketUpdateBody,
    noteSocketUpdateSchema
} from './schemas/note.js';

export const noteHandler = (_io: SocketIoServer, socket: SocketIoSocket) => {
    // notify users when a shared note is updated
    socket.on('noteUpdate', async (body: NoteSocketUpdateBody) => {
        try {
            validateSchema(noteSocketUpdateSchema, body);
            const { sessionId, user, isMaster } = socket.data;
            const { noteId } = body;
            const cacheKey = getNoteCacheKey(noteId);
            const cachedNote = await cache.getJson<Note>(cacheKey);
            const note =
                cachedNote ?? (await getUserNoteByIdOrThrow(user.id, noteId));
            if (note.userId !== user.id) {
                throw new ForbiddenError(
                    `Note ${note.id} does not belong to user ${user.id}`
                );
            }
            if (!note.isShared) {
                throw new ForbiddenError(`Note ${note.id} is not shared`);
            }
            if (!cachedNote) {
                await cache.setJson<Note>(cacheKey, note);
            }
            socket.to(String(sessionId)).emit(
                'noteUpdate',
                meta({
                    user,
                    isMaster,
                    note
                })
            );
        } catch (err) {
            socket.emit('error', meta(err));
        }
    });
    // notify users when a shared note is deleted / unshared
    socket.on('noteDelete', (body: NoteSocketUpdateBody) => {
        try {
            validateSchema(noteSocketUpdateSchema, body);
            const { sessionId, user, isMaster } = socket.data;
            const { noteId } = body;
            socket.to(String(sessionId)).emit(
                'noteDelete',
                meta({
                    user,
                    isMaster,
                    noteId
                })
            );
        } catch (err) {
            socket.emit('error', meta(err));
        }
    });
};
