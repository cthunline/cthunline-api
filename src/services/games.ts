import {
    callOfCthulhu,
    dnd5,
    seventhSea,
    starWarsD6,
    warhammerFantasy
} from '@cthunline/games';

// list of available games
export const Games = {
    callOfCthulhu: {
        name: 'Call of Cthulhu',
        schema: callOfCthulhu.schema
    },
    dnd5: {
        name: 'Dungeons & Dragons 5E',
        schema: dnd5.schema
    },
    seventhSea: {
        name: '7th Sea',
        schema: seventhSea.schema
    },
    starWarsD6: {
        name: 'Star Wars D6',
        schema: starWarsD6.schema
    },
    warhammerFantasy: {
        name: 'Warhammer Fantasy',
        schema: warhammerFantasy.schema
    }
};

// games data without fields not needed for api endpoints
export const GamesData = Object.fromEntries(
    Object.entries(Games).map(([id, { name }]) => [id, { id, name }])
);

// check a gameId exists
export const isValidGameId = (gameId: string) =>
    Object.keys(Games).includes(gameId);

export type GameId = keyof typeof Games;
