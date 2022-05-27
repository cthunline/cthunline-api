import {
    callOfCthulhu,
    dnd5,
    starWarsD6
} from '@cthunline/games';

import Validator from './validator';

// list of available games
export const Games = {
    callOfCthulhu: {
        name: 'Call of Cthulhu',
        schema: callOfCthulhu.schema,
        validator: Validator(callOfCthulhu.schema)
    },
    dnd5: {
        name: 'Dungeons & Dragons 5E',
        schema: dnd5.schema,
        validator: Validator(dnd5.schema)
    },
    starWarsD6: {
        name: 'Star Wars D6',
        schema: starWarsD6.schema,
        validator: Validator(starWarsD6.schema)
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
