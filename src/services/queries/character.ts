import { and, eq } from 'drizzle-orm';

import type { CharacterInsert, CharacterUpdate } from '../../drizzle/schema.js';
import { db, tables } from '../../services/db.js';
import { InternError, NotFoundError } from '../../services/errors.js';

/**
Gets characters. Can be filtered by user ID.
*/
export const getCharacters = async (userId?: number) =>
    db
        .select()
        .from(tables.characters)
        .where(userId ? eq(tables.characters.userId, userId) : undefined);

/**
Gets characters belonging to a user. Can be filtered by the game ID.
*/
export const getUserCharacters = async (userId: number, gameId?: string) =>
    db
        .select()
        .from(tables.characters)
        .where(
            gameId
                ? and(
                      eq(tables.characters.userId, userId),
                      eq(tables.characters.gameId, gameId)
                  )
                : eq(tables.characters.userId, userId)
        );

/**
Gets a character with the given ID.
*/
export const getCharacterById = async (characterId: number) => {
    const characters = await db
        .select()
        .from(tables.characters)
        .where(eq(tables.characters.id, characterId));
    if (characters[0]) {
        return characters[0];
    }
    return null;
};

/**
Gets a character with the given ID. Throws a NotFoundError if it does not exist.
*/
export const getCharacterByIdOrThrow = async (characterId: number) => {
    const character = await getCharacterById(characterId);
    if (!character) {
        throw new NotFoundError('Character not found');
    }
    return character;
};

/**
Creates a character.
*/
export const createCharacter = async (data: CharacterInsert) => {
    const insertedCharacters = await db
        .insert(tables.characters)
        .values(data)
        .returning();
    const character = insertedCharacters[0];
    if (!character) {
        throw new InternError('Could not retreive inserted character');
    }
    return character;
};

/**
Updates a character with the given ID.
*/
export const updateCharacterById = async (
    characterId: number,
    data: CharacterUpdate
) => {
    const updatedCharacters = await db
        .update(tables.characters)
        .set(data)
        .where(eq(tables.characters.id, characterId))
        .returning();
    const character = updatedCharacters[0];
    if (!character) {
        throw new InternError('Could not retreive updated character');
    }
    return character;
};

/**
Deletes a character with the given ID.
*/
export const deleteCharacterById = async (characterId: number) =>
    db.delete(tables.characters).where(eq(tables.characters.id, characterId));
