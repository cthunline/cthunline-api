import { charactersData } from '../helpers/data.helper.js';

export const getUserCharacters = (userId: number, gameId?: string) =>
    charactersData.filter(
        (char) => char.userId === userId && (!gameId || char.gameId === gameId)
    );

export const findCharacter = (userId: number, gameId?: string) => {
    const character = charactersData.find(
        (char) => char.userId === userId && (!gameId || char.gameId === gameId)
    );
    if (character) {
        return character as any;
    }
    throw new Error(`Could not find character for user ${userId}`);
};
