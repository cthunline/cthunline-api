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

export type GameId = keyof typeof Games;
