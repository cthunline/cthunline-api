import Validator from '../services/validator';
import CoCCharacterSchema from './callOfCthulhu/schema.json';
import DnD5CharacterSchema from './dnd5/schema.json';
import SWD6CharacterSchema from './starWarsD6/schema.json';

// list of available games
export const Games = {
    callOfCthulhu: {
        name: 'Call of Cthulhu',
        schema: CoCCharacterSchema,
        validator: Validator(CoCCharacterSchema)
    },
    dnd5: {
        name: 'Dungeons & Dragons 5E',
        schema: DnD5CharacterSchema,
        validator: Validator(DnD5CharacterSchema)
    },
    starWarsD6: {
        name: 'Star Wars D6',
        schema: SWD6CharacterSchema,
        validator: Validator(SWD6CharacterSchema)
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
