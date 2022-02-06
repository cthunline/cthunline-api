import { Character } from '@prisma/client';
import Games from './games.json';
import { Prisma } from '../services/prisma';
import Validator from '../services/validator';
import { NotFoundError } from '../services/errors';
import CoCCharacterSchema from './callOfCthulhu/schema.json';

type GameId = keyof typeof Games;

const CharacterValidators: Record<GameId, Function> = {
    callOfCthulhu: Validator(CoCCharacterSchema)
};

interface CharacterSheetArgs {
    id?: string;
    userId: string;
    gameId: GameId;
    name: string;
    data: object;
}

class CharacterSheet {
    id?: string;
    userId: string;
    gameId: GameId;
    name: string;
    data: object;

    constructor({
        id,
        userId,
        gameId,
        name,
        data
    }: CharacterSheetArgs) {
        const characterData = data;
        if (id) {
            this.id = id;
        }
        this.userId = userId;
        this.gameId = gameId;
        if (!Object.keys(Games).includes(gameId)) {
            throw new NotFoundError('Game not found');
        }
        this.name = name;
        CharacterValidators[gameId](characterData);
        this.data = characterData;
    }

    async save(): Promise<Character> {
        const data = {
            userId: this.userId,
            gameId: this.gameId,
            name: this.name,
            data: this.data
        };
        if (this.id) {
            return Prisma.character.update({
                data,
                where: {
                    id: this.id
                }
            });
        }
        const createdCharacter = await Prisma.character.create({
            data
        });
        this.id = createdCharacter.id;
        return createdCharacter;
    }
}

export {
    Games,
    GameId,
    CharacterSheet
};
