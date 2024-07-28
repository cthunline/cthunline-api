import { usersData } from './data.helper.js';

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
