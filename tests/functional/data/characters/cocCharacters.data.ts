import type { CharacterInsert } from '../../../../src/drizzle/schema.js';

export const cocCharacters: CharacterInsert[] = [
    {
        id: 1,
        userId: 3,
        gameId: 'callOfCthulhu',
        name: 'Ada Hegerberg (soccer player)',
        portrait: null,
        data: {
            biography: {
                name: 'Ada Hegerberg',
                birthPlace: 'Molde, Norway',
                occupation: 'Athlete',
                residence: 'Lyon, France',
                age: 26
            },
            characteristics: {
                strength: {
                    regular: 75,
                    half: 37,
                    fifth: 15
                },
                constitution: {
                    regular: 55,
                    half: 27,
                    fifth: 11
                },
                size: {
                    regular: 65,
                    half: 32,
                    fifth: 13
                },
                dexterity: {
                    regular: 75,
                    half: 37,
                    fifth: 15
                },
                appearance: {
                    regular: 65,
                    half: 32,
                    fifth: 13
                },
                education: {
                    regular: 71,
                    half: 35,
                    fifth: 14
                },
                intelligence: {
                    regular: 50,
                    half: 25,
                    fifth: 10
                },
                power: {
                    regular: 25,
                    half: 12,
                    fifth: 5
                }
            },
            points: {
                hitPoints: {
                    current: 12,
                    maximum: 12
                },
                magicPoints: {
                    current: 5,
                    maximum: 5
                }
            },
            luck: {
                current: 15,
                starting: 15
            },
            sanity: {
                starting: 25,
                current: 25,
                maximum: 99
            },
            status: {
                temporaryInsanity: false,
                indefiniteInsanity: false,
                majorWound: false,
                unconscious: false,
                dying: false
            },
            skills: [
                {
                    name: 'Charm',
                    development: true,
                    developed: true,
                    base: '15%',
                    regular: 35,
                    half: 17,
                    fifth: 7
                },
                {
                    name: 'Credit Rating',
                    development: false,
                    developed: false,
                    base: '0%',
                    regular: 32,
                    half: 16,
                    fifth: 6
                },
                {
                    name: 'Fighting: Brawl',
                    development: true,
                    developed: true,
                    base: '25%',
                    regular: 40,
                    half: 20,
                    fifth: 8
                },
                {
                    name: 'Firearms: Rifle/Shotgun',
                    development: true,
                    developed: true,
                    base: '25%',
                    regular: 50,
                    half: 25,
                    fifth: 10
                },
                {
                    name: 'First Aid',
                    development: true,
                    developed: true,
                    base: '30%',
                    regular: 50,
                    half: 25,
                    fifth: 10
                },
                {
                    name: 'Jump',
                    development: true,
                    developed: true,
                    base: '20%',
                    regular: 50,
                    half: 25,
                    fifth: 10
                },
                {
                    name: 'Language (Other): English',
                    development: true,
                    developed: true,
                    base: '1%',
                    regular: 70,
                    half: 35,
                    fifth: 14
                },
                {
                    name: 'Language (Own): Norwegian',
                    development: true,
                    developed: true,
                    base: 'EDU',
                    regular: 80,
                    half: 40,
                    fifth: 16
                },
                {
                    name: 'Occult',
                    development: true,
                    developed: true,
                    base: '5%',
                    regular: 25,
                    half: 12,
                    fifth: 5
                },
                {
                    name: 'Sport: Soccer',
                    development: true,
                    developed: true,
                    base: '0%',
                    regular: 70,
                    half: 35,
                    fifth: 14
                },
                {
                    name: 'Spot Hidden',
                    development: true,
                    developed: true,
                    base: '25%',
                    regular: 40,
                    half: 20,
                    fifth: 8
                },
                {
                    name: 'Stealth',
                    development: true,
                    developed: true,
                    base: '20%',
                    regular: 40,
                    half: 20,
                    fifth: 8
                },
                {
                    name: 'Swim',
                    development: true,
                    developed: true,
                    base: '20%',
                    regular: 55,
                    half: 27,
                    fifth: 11
                },
                {
                    name: 'Throw',
                    development: true,
                    developed: true,
                    base: '20%',
                    regular: 55,
                    half: 27,
                    fifth: 11
                }
            ],
            combat: {
                move: 9,
                build: '+1',
                damageBonus: '+1D4'
            },
            weapons: [
                {
                    name: 'Unarmed',
                    damage: '1D3 + DB',
                    attacks: '1',
                    range: '',
                    ammo: '',
                    malfunction: '0'
                }
            ],
            story: {
                story: 'Ada Martine Stolsmo Hegerberg is a Norwegian professional footballer who plays as a striker for the Division 1 Féminine club Olympique Lyonnais.',
                personalDescription:
                    'Ut voluptas voluptas et assumenda illo ad adipisci temporibus ut voluptates dignissimos et nulla impedit.',
                ideologyAndBeliefs:
                    'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.',
                significantPeople:
                    'Id accusantium dolore id ratione pariatur id quia ratione est velit facilis.',
                meaningfulLocations:
                    'Et harum quidem rerum facilis est et expedita distinctio.',
                treasuredPossessions: 'A ball and soccer shoes',
                traits: 'Cupiditate officia',
                injuriesAndScars: 'Sed nemo repellendus',
                phobiasAndManias: 'Dolorem est obcaecati',
                arcaneTomesAndSpells: 'Quis dicta et ipsa',
                encountersWithStrangeEntities:
                    'Dignissimos modi quo molestiae alias',
                gearAndPossessions: 'Numquam quo sunt aliquid',
                spendingLevel: '10$',
                cash: '64$',
                assets: '1600$',
                fellowInvestigators: 'Delphine, Ada, Selma'
            }
        }
    },
    {
        id: 2,
        userId: 1,
        gameId: 'callOfCthulhu',
        name: 'Susanne Sundfor (singer)',
        portrait: null,
        data: {
            biography: {
                name: 'Susanne Sundfor',
                birthPlace: 'Haugesund, Norway',
                occupation: 'Musician',
                residence: 'Oslo, Norway',
                age: 35
            },
            characteristics: {
                strength: {
                    regular: 50,
                    half: 25,
                    fifth: 10
                },
                constitution: {
                    regular: 50,
                    half: 25,
                    fifth: 10
                },
                size: {
                    regular: 45,
                    half: 22,
                    fifth: 9
                },
                dexterity: {
                    regular: 60,
                    half: 30,
                    fifth: 12
                },
                appearance: {
                    regular: 75,
                    half: 37,
                    fifth: 15
                },
                education: {
                    regular: 60,
                    half: 30,
                    fifth: 12
                },
                intelligence: {
                    regular: 60,
                    half: 30,
                    fifth: 12
                },
                power: {
                    regular: 60,
                    half: 30,
                    fifth: 12
                }
            },
            points: {
                hitPoints: {
                    current: 5,
                    maximum: 5
                },
                magicPoints: {
                    current: 12,
                    maximum: 12
                }
            },
            luck: {
                current: 30,
                starting: 30
            },
            sanity: {
                starting: 60,
                current: 60,
                maximum: 99
            },
            status: {
                temporaryInsanity: false,
                indefiniteInsanity: false,
                majorWound: false,
                unconscious: false,
                dying: false
            },
            skills: [
                {
                    name: 'Art: Singing',
                    development: true,
                    developed: true,
                    base: '5%',
                    regular: 90,
                    half: 45,
                    fifth: 18
                },
                {
                    name: 'Art: Piano',
                    development: true,
                    developed: true,
                    base: '5%',
                    regular: 80,
                    half: 40,
                    fifth: 16
                },
                {
                    name: 'Charm',
                    development: true,
                    developed: true,
                    base: '15%',
                    regular: 70,
                    half: 35,
                    fifth: 14
                },
                {
                    name: 'Credit Rating',
                    development: false,
                    developed: false,
                    base: '0%',
                    regular: 30,
                    half: 15,
                    fifth: 6
                },
                {
                    name: 'Disguise',
                    development: true,
                    developed: true,
                    base: '5%',
                    regular: 15,
                    half: 7,
                    fifth: 3
                },
                {
                    name: 'Language (Other): English',
                    development: true,
                    developed: true,
                    base: '1%',
                    regular: 70,
                    half: 35,
                    fifth: 14
                },
                {
                    name: 'Language (Own): Norwegian',
                    development: true,
                    developed: true,
                    base: 'EDU',
                    regular: 80,
                    half: 40,
                    fifth: 16
                },
                {
                    name: 'Listen',
                    development: true,
                    developed: true,
                    base: '20%',
                    regular: 40,
                    half: 20,
                    fifth: 8
                },
                {
                    name: 'Locksmith',
                    development: true,
                    developed: true,
                    base: '1%',
                    regular: 40,
                    half: 20,
                    fifth: 8
                },
                {
                    name: 'Persuade',
                    development: true,
                    developed: true,
                    base: '10%',
                    regular: 40,
                    half: 20,
                    fifth: 8
                },
                {
                    name: 'Psychology',
                    development: true,
                    developed: true,
                    base: '10%',
                    regular: 50,
                    half: 25,
                    fifth: 10
                },
                {
                    name: 'Read Lips',
                    development: true,
                    developed: true,
                    base: '0%',
                    regular: 30,
                    half: 15,
                    fifth: 6
                },
                {
                    name: 'Sleight of Hand',
                    development: true,
                    developed: true,
                    base: '10%',
                    regular: 30,
                    half: 15,
                    fifth: 6
                },
                {
                    name: 'Spot Hidden',
                    development: true,
                    developed: true,
                    base: '25%',
                    regular: 50,
                    half: 25,
                    fifth: 10
                },
                {
                    name: 'Stealth',
                    development: true,
                    developed: true,
                    base: '20%',
                    regular: 40,
                    half: 20,
                    fifth: 8
                }
            ],
            combat: {
                move: 9,
                build: 'None',
                damageBonus: '0'
            },
            weapons: [
                {
                    name: 'Unarmed',
                    damage: '1D3 + DB',
                    attacks: '1',
                    range: '',
                    ammo: '',
                    malfunction: '0'
                }
            ],
            story: {
                story: 'Susanne Aartun Sundfor is a Norwegian singer-songwriter. Et iusto quia tempore minus eos itaque ullam sed iste error aut quos dolorem.',
                personalDescription:
                    'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.',
                ideologyAndBeliefs:
                    'Ut voluptas voluptas et assumenda illo ad adipisci temporibus ut voluptates dignissimos et nulla impedit.',
                significantPeople:
                    'Lorem ipsum dolor sit amet. Et laboriosam voluptas sit iusto quia est blanditiis dolores est veniam esse.',
                meaningfulLocations:
                    'Id accusantium dolore id ratione pariatur id quia ratione est velit facilis.',
                treasuredPossessions: 'A mic and a piano',
                traits: 'Sed nemo repellendus',
                injuriesAndScars: 'Cupiditate officia',
                phobiasAndManias: 'Quis dicta et ipsa',
                arcaneTomesAndSpells: 'Dolorem est obcaecati',
                encountersWithStrangeEntities: 'Numquam quo sunt aliquid',
                gearAndPossessions: 'Dignissimos modi quo molestiae alias',
                spendingLevel: '10$',
                cash: '40$',
                assets: '1000$',
                fellowInvestigators: 'Amandine, Amel, Sarah'
            }
        }
    },
    {
        id: 3,
        userId: 2,
        gameId: 'callOfCthulhu',
        name: 'Delphine Cascarino (soccer player)',
        portrait: null,
        data: {
            biography: {
                name: 'Delphine Cascarino',
                birthPlace: 'Saint-Priest, France',
                occupation: 'Athlete',
                residence: 'Lyon, France',
                age: 25
            },
            characteristics: {
                strength: {
                    regular: 75,
                    half: 37,
                    fifth: 15
                },
                constitution: {
                    regular: 55,
                    half: 27,
                    fifth: 11
                },
                size: {
                    regular: 65,
                    half: 32,
                    fifth: 13
                },
                dexterity: {
                    regular: 75,
                    half: 37,
                    fifth: 15
                },
                appearance: {
                    regular: 65,
                    half: 32,
                    fifth: 13
                },
                education: {
                    regular: 71,
                    half: 35,
                    fifth: 14
                },
                intelligence: {
                    regular: 50,
                    half: 25,
                    fifth: 10
                },
                power: {
                    regular: 25,
                    half: 12,
                    fifth: 5
                }
            },
            points: {
                hitPoints: {
                    current: 12,
                    maximum: 12
                },
                magicPoints: {
                    current: 5,
                    maximum: 5
                }
            },
            luck: {
                current: 15,
                starting: 15
            },
            sanity: {
                starting: 25,
                current: 25,
                maximum: 99
            },
            status: {
                temporaryInsanity: false,
                indefiniteInsanity: false,
                majorWound: false,
                unconscious: false,
                dying: false
            },
            skills: [
                {
                    name: 'Charm',
                    development: true,
                    developed: true,
                    base: '15%',
                    regular: 35,
                    half: 17,
                    fifth: 7
                },
                {
                    name: 'Credit Rating',
                    development: false,
                    developed: false,
                    base: '0%',
                    regular: 32,
                    half: 16,
                    fifth: 6
                },
                {
                    name: 'Fighting: Brawl',
                    development: true,
                    developed: true,
                    base: '25%',
                    regular: 40,
                    half: 20,
                    fifth: 8
                },
                {
                    name: 'Firearms: Rifle/Shotgun',
                    development: true,
                    developed: true,
                    base: '25%',
                    regular: 50,
                    half: 25,
                    fifth: 10
                },
                {
                    name: 'First Aid',
                    development: true,
                    developed: true,
                    base: '30%',
                    regular: 50,
                    half: 25,
                    fifth: 10
                },
                {
                    name: 'Jump',
                    development: true,
                    developed: true,
                    base: '20%',
                    regular: 50,
                    half: 25,
                    fifth: 10
                },
                {
                    name: 'Language (Other): English',
                    development: true,
                    developed: true,
                    base: '1%',
                    regular: 70,
                    half: 35,
                    fifth: 14
                },
                {
                    name: 'Language (Own): Norwegian',
                    development: true,
                    developed: true,
                    base: 'EDU',
                    regular: 80,
                    half: 40,
                    fifth: 16
                },
                {
                    name: 'Occult',
                    development: true,
                    developed: true,
                    base: '5%',
                    regular: 25,
                    half: 12,
                    fifth: 5
                },
                {
                    name: 'Sport: Soccer',
                    development: true,
                    developed: true,
                    base: '0%',
                    regular: 70,
                    half: 35,
                    fifth: 14
                },
                {
                    name: 'Spot Hidden',
                    development: true,
                    developed: true,
                    base: '25%',
                    regular: 40,
                    half: 20,
                    fifth: 8
                },
                {
                    name: 'Stealth',
                    development: true,
                    developed: true,
                    base: '20%',
                    regular: 40,
                    half: 20,
                    fifth: 8
                },
                {
                    name: 'Swim',
                    development: true,
                    developed: true,
                    base: '20%',
                    regular: 55,
                    half: 27,
                    fifth: 11
                },
                {
                    name: 'Throw',
                    development: true,
                    developed: true,
                    base: '20%',
                    regular: 55,
                    half: 27,
                    fifth: 11
                }
            ],
            combat: {
                move: 9,
                build: '+1',
                damageBonus: '+1D4'
            },
            weapons: [
                {
                    name: 'Unarmed',
                    damage: '1D3 + DB',
                    attacks: '1',
                    range: '',
                    ammo: '',
                    malfunction: '0'
                }
            ],
            story: {
                story: 'Delphine Cascarino is a French professional footballer who plays as a midfielder for Division 1 Féminine club Lyon and the France national team.',
                personalDescription:
                    'Ut voluptas voluptas et assumenda illo ad adipisci temporibus ut voluptates dignissimos et nulla impedit.',
                ideologyAndBeliefs:
                    'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.',
                significantPeople:
                    'Id accusantium dolore id ratione pariatur id quia ratione est velit facilis.',
                meaningfulLocations:
                    'Et harum quidem rerum facilis est et expedita distinctio.',
                treasuredPossessions: 'A ball and soccer shoes',
                traits: 'Cupiditate officia',
                injuriesAndScars: 'Sed nemo repellendus',
                phobiasAndManias: 'Dolorem est obcaecati',
                arcaneTomesAndSpells: 'Quis dicta et ipsa',
                encountersWithStrangeEntities:
                    'Dignissimos modi quo molestiae alias',
                gearAndPossessions: 'Numquam quo sunt aliquid',
                spendingLevel: '10$',
                cash: '64$',
                assets: '1600$',
                fellowInvestigators: 'Lindsay, Christiane, Sakina'
            }
        }
    }
];
