import { type Note } from '../../drizzle/schema.js';
import { cache } from '../../services/cache.js';

/**
Builds the cache key for note
*/
export const getNoteCacheKey = (noteId: number) => `note-${noteId}`;

/**
Updates note in cache if exists.
*/
export const updateCachedNoteIfExists = async (note: Note) => {
    const cacheKey = getNoteCacheKey(note.id);
    const cachedNote = await cache.getJson<Note>(cacheKey);
    if (cachedNote) {
        await cache.setJson<Note>(cacheKey, note);
    }
};

/**
Deletes note in cache.
*/
export const deleteCachedNote = async (noteId: number) => {
    const cacheKey = getNoteCacheKey(noteId);
    await cache.del(cacheKey);
};
