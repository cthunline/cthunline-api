import { Character } from '@prisma/client';
import Games from '../games.json';
import { Prisma } from '../../services/prisma';
import Validator from '../../services/validator';
import { CoCCharacter } from './types';
import CoCCharacterSchema from './schema.json';

const validateData = Validator(CoCCharacterSchema);

class CoCCharacterSheet {
    id?: string;
    userId: string;
    game: string = Games.callOfCthulhu;
    name: string;
    data: CoCCharacter;

    constructor(data: CoCCharacter, userId: string, id?: string) {
        validateData(data);
        if (id) {
            this.id = id;
        }
        this.userId = userId;
        this.name = data.biography.name;
        this.data = data;
    }

    async save(): Promise<Character> {
        const data = {
            userId: this.userId,
            game: this.game,
            name: this.name,
            data: this.data as object
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

export default CoCCharacterSheet;
