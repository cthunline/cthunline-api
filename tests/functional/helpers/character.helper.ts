import { charactersData, usersData } from '../helpers/data.helper.js';

export const findCharacter = (userId: number, gameId?: string) => {
    const character = charactersData.find(
        (char) => char.userId === userId && (!gameId || char.gameId === gameId)
    );
    if (character) {
        return character as any;
    }
    throw new Error(`Could not find character for user ${userId}`);
};

export const getAnotherUser = (selfUserId: number, mustBeEnabled = true) => {
    const user = usersData.find(
        ({ id, isEnabled }) =>
            (!mustBeEnabled || isEnabled) && id !== selfUserId
    );
    if (user) {
        return user;
    }
    throw new Error('Could not find another user to run test');
};
