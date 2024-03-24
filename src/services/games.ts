import {
    callOfCthulhu,
    dnd5,
    seventhSea,
    starWarsD6,
    warhammerFantasy
} from '@cthunline/games';

export type GameId = keyof typeof games;

/**
List of available games.
*/
export const games = {
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

/**
Games data without fields not needed for api endpoints.
*/
export const gamesData = Object.fromEntries(
    Object.entries(games).map(([id, { name }]) => [id, { id, name }])
);

/**
Check a gameId exists.
*/
export const isValidGameId = (gameId: string): gameId is GameId =>
    Object.keys(games).includes(gameId);
