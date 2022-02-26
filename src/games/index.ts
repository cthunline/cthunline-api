import Validator from '../services/validator';
import CoCCharacterSchema from './callOfCthulhu/schema.json';

// list of available games
export const Games = {
    callOfCthulhu: {
        name: 'Call of Cthulhu',
        schema: CoCCharacterSchema,
        validator: Validator(CoCCharacterSchema)
    }
};

// games data without fields not needed for api endpoints
export const GamesData = Object.fromEntries(
    Object.entries(Games).map((
        [id, { name }]
    ) => (
        [id, { id, name }]
    ))
);

// check a gameId exists
export const isValidGameId = (gameId: string) => (
    Object.keys(Games).includes(gameId)
);

export type GameId = keyof typeof Games;
