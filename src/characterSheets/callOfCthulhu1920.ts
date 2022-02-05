import { Prisma } from '../services/prisma';
import { CoCCharacter } from '../types/callOfCthulhu';

class CallOfCthulhu1920 {
    id?: string;
    userId: string;
    game: string = 'Call of Cthulhu 1920';
    name: string;
    data: CoCCharacter;

    constructor(userId: string, data: CoCCharacter) {
        this.userId = userId;
        this.name = data.biography.name;
        this.data = data;
    }

    async save() {
        const data = {
            userId: this.userId,
            game: this.game,
            name: this.name,
            data: this.data as object
        };
        if (this.id) {
            await Prisma.character.update({
                data,
                where: {
                    id: this.id
                }
            });
        } else {
            const {
                id: createdId
            } = await Prisma.character.create({
                data
            });
            this.id = createdId;
        }
    }
}

export default CallOfCthulhu1920;
