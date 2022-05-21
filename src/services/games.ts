import schemas from '@cthunline/games';

import Validator from './validator';

// list of available games
export const Games = {
    callOfCthulhu: {
        name: 'Call of Cthulhu',
        schema: schemas.callOfCthulhu,
        validator: Validator(schemas.callOfCthulhu)
    },
    dnd5: {
        name: 'Dungeons & Dragons 5E',
        schema: schemas.dnd5,
        validator: Validator(schemas.dnd5)
    },
    starWarsD6: {
        name: 'Star Wars D6',
        schema: schemas.starWarsD6,
        validator: Validator(schemas.starWarsD6)
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
