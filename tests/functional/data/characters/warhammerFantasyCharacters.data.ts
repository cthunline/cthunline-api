import { type CharacterInsert } from '../../../../src/drizzle/schema.js';

export const warhammerFantasyCharacters: CharacterInsert[] = [
    {
        id: 10,
        userId: 1,
        gameId: 'warhammerFantasy',
        name: 'Molrella Brandysnap',
        portrait: null,
        data: {
            biography: {
                name: 'Molrella Brandysnap',
                species: 'Halfling',
                class: 'Rogue',
                career: 'Thief',
                careerLevel: 'Thief',
                careerPath: 'Pauper, Prowler, Thief',
                status: 'Brass 3',
                age: '38',
                height: '3\'1"',
                hair: 'Dark brown',
                eyes: 'Chestnut'
            },
            characteristics: {
                weaponSkill: {
                    initial: 23,
                    advances: 0,
                    current: 23,
                    careerLevel: 1
                },
                ballisticSkill: {
                    initial: 39,
                    advances: 0,
                    current: 39
                },
                strength: {
                    initial: 20,
                    advances: 0,
                    current: 20
                },
                toughness: {
                    initial: 27,
                    advances: 5,
                    current: 32,
                    careerLevel: 1
                },
                initiative: {
                    initial: 38,
                    advances: 5,
                    current: 43,
                    careerLevel: 1
                },
                agility: {
                    initial: 39,
                    advances: 5,
                    current: 44
                },
                dexterity: {
                    initial: 46,
                    advances: 0,
                    current: 46,
                    careerLevel: 3
                },
                intelligence: {
                    initial: 26,
                    advances: 0,
                    current: 26,
                    careerLevel: 2
                },
                willpower: {
                    initial: 43,
                    advances: 5,
                    current: 48
                },
                fellowship: {
                    initial: 45,
                    advances: 5,
                    current: 50,
                    careerLevel: 4
                }
            },
            fate: {
                fate: 2,
                fortune: 3
            },
            resilience: {
                resilience: 3,
                resolve: 3,
                motivation: 'Some motivation'
            },
            experience: {
                current: 0,
                spent: 2200,
                total: 2200
            },
            movement: {
                movement: 3,
                walk: 6,
                run: 12
            },
            basicSkills: {
                art: {
                    characteristicName: 'dexterity',
                    advances: 0,
                    skill: 46
                },
                athletics: {
                    characteristicName: 'agility',
                    advances: 5,
                    skill: 49
                },
                bribery: {
                    characteristicName: 'fellowship',
                    advances: 0,
                    skill: 50
                },
                charm: {
                    characteristicName: 'fellowship',
                    advances: 0,
                    skill: 50,
                    careerLevel: 1
                },
                charmAnimal: {
                    characteristicName: 'willpower',
                    advances: 0,
                    skill: 48
                },
                climb: {
                    characteristicName: 'strength',
                    advances: 15,
                    skill: 35,
                    careerLevel: 1
                },
                cool: {
                    characteristicName: 'willpower',
                    advances: 10,
                    skill: 58
                },
                consumeAlcohol: {
                    characteristicName: 'toughness',
                    advances: 0,
                    skill: 32
                },
                dodge: {
                    characteristicName: 'agility',
                    advances: 10,
                    skill: 54,
                    careerLevel: 1
                },
                drive: {
                    characteristicName: 'agility',
                    advances: 0,
                    skill: 44
                },
                endurance: {
                    characteristicName: 'toughness',
                    advances: 10,
                    skill: 42
                },
                entertain: {
                    characteristicName: 'fellowship',
                    advances: 0,
                    skill: 50,
                    careerLevel: 2
                },
                gamble: {
                    characteristicName: 'intelligence',
                    advances: 0,
                    skill: 26,
                    careerLevel: 1
                },
                gossip: {
                    characteristicName: 'fellowship',
                    advances: 0,
                    skill: 50
                },
                haggle: {
                    characteristicName: 'fellowship',
                    advances: 0,
                    skill: 50
                },
                intimidate: {
                    characteristicName: 'strength',
                    advances: 0,
                    skill: 20
                },
                intuition: {
                    characteristicName: 'initiative',
                    advances: 5,
                    skill: 48
                },
                leadership: {
                    characteristicName: 'fellowship',
                    advances: 0,
                    skill: 50,
                    careerLevel: 2
                },
                meleeBasic: {
                    characteristicName: 'weaponSkill',
                    advances: 0,
                    skill: 23,
                    careerLevel: 2
                },
                melee: {
                    characteristicName: 'weaponSkill',
                    advances: 0,
                    skill: 23
                },
                navigation: {
                    characteristicName: 'initiative',
                    advances: 0,
                    skill: 43
                },
                outdoorSurvival: {
                    characteristicName: 'intelligence',
                    advances: 0,
                    skill: 26
                },
                perception: {
                    characteristicName: 'initiative',
                    advances: 10,
                    skill: 53,
                    careerLevel: 3
                },
                ride: {
                    characteristicName: 'agility',
                    advances: 0,
                    skill: 44
                },
                row: {
                    characteristicName: 'strength',
                    advances: 0,
                    skill: 20
                },
                stealth: {
                    characteristicName: 'agility',
                    advances: 10,
                    skill: 54
                }
            },
            otherSkills: [
                {
                    name: 'Entertain (comedy)',
                    characteristicName: 'fellowship',
                    advances: 10,
                    skill: 60,
                    careerLevel: 4
                },
                {
                    name: 'Pick lock',
                    characteristicName: 'dexterity',
                    advances: 5,
                    skill: 51,
                    careerLevel: 4
                },
                {
                    name: 'Sleight of hand',
                    characteristicName: 'dexterity',
                    advances: 4,
                    skill: 50
                }
            ],
            talents: [
                {
                    name: 'Acute senses (Taste)',
                    timesTaken: 1,
                    description: ''
                },
                {
                    name: 'Alley cat',
                    timesTaken: 1,
                    description: ''
                },
                {
                    name: 'Criminals',
                    timesTaken: 1,
                    description: ''
                },
                {
                    name: 'Etiquette (criminals)',
                    timesTaken: 1,
                    description: ''
                },
                {
                    name: 'Fast hands',
                    timesTaken: 1,
                    description: ''
                },
                {
                    name: 'Luck',
                    timesTaken: 1,
                    description: ''
                },
                {
                    name: 'Night vision',
                    timesTaken: 1,
                    description: ''
                },
                {
                    name: 'Orientation',
                    timesTaken: 1,
                    description: ''
                },
                {
                    name: 'Panhandle',
                    timesTaken: 1,
                    description: ''
                },
                {
                    name: 'Resistence (chaos)',
                    timesTaken: 1,
                    description: ''
                },
                {
                    name: 'Size (small)',
                    timesTaken: 1,
                    description: ''
                },
                {
                    name: 'Stone soup',
                    timesTaken: 1,
                    description: ''
                }
            ],
            ambitions: {
                shortTerm: 'Random text',
                longTerm: 'Another random text'
            },
            party: {
                name: 'Random name',
                shortTerm: 'Random text',
                longTerm: 'Another random text',
                members: 'Some members'
            },
            armour: [
                {
                    name: 'Leather jack',
                    locations: 'Body',
                    encumbrance: 1,
                    armourPoints: 1,
                    qualities: ''
                }
            ],
            armourPoints: {
                head: 0,
                rightArm: 0,
                leftArm: 0,
                body: 1,
                rightLeg: 0,
                leftLeg: 0,
                shield: 0
            },
            trappings: [
                {
                    name: 'Healing draught',
                    encumbrance: 0
                },
                {
                    name: 'Lock picks',
                    encumbrance: 0
                }
            ],
            psychology: 'Random text',
            corruptionMutation: 'Another random text',
            wealth: {
                brassPennies: 10,
                silverShillings: 2,
                goldCrowns: 0
            },
            encumbrance: {
                weapons: 1,
                armour: 0,
                trappings: 0,
                total: 1,
                maximumBonus: 0,
                maximum: 5
            },
            wounds: {
                strengthBonus: 2,
                twiceToughnessBonus: 6,
                willpowerBonus: 4,
                hardy: false,
                total: 12,
                current: 0,
                notes: ''
            },
            weapons: [
                {
                    name: 'Short sword',
                    group: 'Basic',
                    encumbrance: 1,
                    rangeReach: 'Average',
                    damage: '+SB +4',
                    qualities: ''
                },
                {
                    name: 'Sling',
                    group: 'Sling',
                    encumbrance: 0,
                    rangeReach: '60 yards',
                    damage: '+6',
                    qualities: 'Pummeling'
                }
            ],
            spells: [],
            sin: 0,
            advantage: 0
        }
    },
    {
        id: 11,
        userId: 3,
        gameId: 'warhammerFantasy',
        name: 'Ferdinand Gruber',
        portrait: null,
        data: {
            biography: {
                name: 'Ferdinand Gruber',
                species: 'Human',
                class: 'Academic',
                career: 'Wizard',
                careerLevel: "Wizard's Apprentice",
                careerPath: "Scion, Wizard's Apprentice",
                status: 'Brass 3',
                age: '27',
                height: '6\'3"',
                hair: 'None',
                eyes: 'Brown'
            },
            characteristics: {
                weaponSkill: {
                    initial: 32,
                    advances: 10,
                    current: 42,
                    careerLevel: 1
                },
                ballisticSkill: {
                    initial: 24,
                    advances: 0,
                    current: 24
                },
                strength: {
                    initial: 25,
                    advances: 0,
                    current: 25,
                    careerLevel: 4
                },
                toughness: {
                    initial: 28,
                    advances: 0,
                    current: 28
                },
                initiative: {
                    initial: 32,
                    advances: 0,
                    current: 32,
                    careerLevel: 3
                },
                agility: {
                    initial: 31,
                    advances: 0,
                    current: 31,
                    careerLevel: 2
                },
                dexterity: {
                    initial: 27,
                    advances: 0,
                    current: 27
                },
                intelligence: {
                    initial: 40,
                    advances: 8,
                    current: 48,
                    careerLevel: 1
                },
                willpower: {
                    initial: 33,
                    advances: 10,
                    current: 43,
                    careerLevel: 1
                },
                fellowship: {
                    initial: 23,
                    advances: 0,
                    current: 23
                }
            },
            fate: {
                fate: 3,
                fortune: 3
            },
            resilience: {
                resilience: 3,
                resolve: 3,
                motivation: 'Another kind of motivation'
            },
            experience: {
                current: 0,
                spent: 2200,
                total: 2200
            },
            movement: {
                movement: 4,
                walk: 8,
                run: 16
            },
            basicSkills: {
                art: {
                    characteristicName: 'dexterity',
                    advances: 0,
                    skill: 27,
                    careerLevel: 3
                },
                athletics: {
                    characteristicName: 'agility',
                    advances: 0,
                    skill: 31,
                    careerLevel: 4
                },
                bribery: {
                    characteristicName: 'fellowship',
                    advances: 10,
                    skill: 33
                },
                charm: {
                    characteristicName: 'fellowship',
                    advances: 0,
                    skill: 23
                },
                charmAnimal: {
                    characteristicName: 'willpower',
                    advances: 0,
                    skill: 43,
                    careerLevel: 1
                },
                climb: {
                    characteristicName: 'strength',
                    advances: 0,
                    skill: 25
                },
                cool: {
                    characteristicName: 'willpower',
                    advances: 20,
                    skill: 63
                },
                consumeAlcohol: {
                    characteristicName: 'toughness',
                    advances: 7,
                    skill: 35
                },
                dodge: {
                    characteristicName: 'agility',
                    advances: 0,
                    skill: 31
                },
                drive: {
                    characteristicName: 'agility',
                    advances: 0,
                    skill: 31,
                    careerLevel: 1
                },
                endurance: {
                    characteristicName: 'toughness',
                    advances: 14,
                    skill: 42
                },
                entertain: {
                    characteristicName: 'fellowship',
                    advances: 0,
                    skill: 23
                },
                gamble: {
                    characteristicName: 'intelligence',
                    advances: 5,
                    skill: 53
                },
                gossip: {
                    characteristicName: 'fellowship',
                    advances: 0,
                    skill: 23,
                    careerLevel: 1
                },
                haggle: {
                    characteristicName: 'fellowship',
                    advances: 0,
                    skill: 23
                },
                intimidate: {
                    characteristicName: 'strength',
                    advances: 0,
                    skill: 25
                },
                intuition: {
                    characteristicName: 'initiative',
                    advances: 11,
                    skill: 43
                },
                leadership: {
                    characteristicName: 'fellowship',
                    advances: 0,
                    skill: 23,
                    careerLevel: 2
                },
                meleeBasic: {
                    characteristicName: 'weaponSkill',
                    advances: 5,
                    skill: 47,
                    careerLevel: 2
                },
                melee: {
                    characteristicName: 'weaponSkill',
                    advances: 0,
                    skill: 42
                },
                navigation: {
                    characteristicName: 'initiative',
                    advances: 0,
                    skill: 32
                },
                outdoorSurvival: {
                    characteristicName: 'intelligence',
                    advances: 0,
                    skill: 48
                },
                perception: {
                    characteristicName: 'initiative',
                    advances: 0,
                    skill: 32
                },
                ride: {
                    characteristicName: 'agility',
                    advances: 0,
                    skill: 31
                },
                row: {
                    characteristicName: 'strength',
                    advances: 0,
                    skill: 25
                },
                stealth: {
                    characteristicName: 'agility',
                    advances: 0,
                    skill: 31
                }
            },
            otherSkills: [
                {
                    name: 'Channelling (Shyish)',
                    characteristicName: 'willpower',
                    advances: 10,
                    skill: 53,
                    careerLevel: 4
                },
                {
                    name: 'Lore (Reikland)',
                    characteristicName: 'intelligence',
                    advances: 3,
                    skill: 51
                },
                {
                    name: 'Heal',
                    characteristicName: 'intelligence',
                    advances: 1,
                    skill: 49,
                    careerLevel: 3
                }
            ],
            talents: [
                {
                    name: 'Aethyric Attunment',
                    timesTaken: 1,
                    description: ''
                },
                {
                    name: 'Coolheaded',
                    timesTaken: 1,
                    description: ''
                },
                {
                    name: 'Doomed',
                    timesTaken: 1,
                    description: ''
                },
                {
                    name: 'Petty Magic',
                    timesTaken: 1,
                    description: ''
                },
                {
                    name: 'Read/Write',
                    timesTaken: 1,
                    description: ''
                },
                {
                    name: 'Savvy',
                    timesTaken: 1,
                    description: ''
                },
                {
                    name: 'Secondsight',
                    timesTaken: 1,
                    description: ''
                },
                {
                    name: 'Sixth Sense',
                    timesTaken: 1,
                    description: ''
                }
            ],
            ambitions: {
                shortTerm: 'Random text',
                longTerm: 'Another random text'
            },
            party: {
                name: 'Random name',
                shortTerm: 'Random text',
                longTerm: 'Another random text',
                members: 'Some members'
            },
            armour: [],
            armourPoints: {
                head: 0,
                rightArm: 0,
                leftArm: 0,
                body: 0,
                rightLeg: 0,
                leftLeg: 0,
                shield: 0
            },
            trappings: [
                {
                    name: 'Grimoire',
                    encumbrance: 0
                },
                {
                    name: "Amethyst Wizard's Uniform",
                    encumbrance: 2
                },
                {
                    name: '6 sheets of Parchment',
                    encumbrance: 0
                },
                {
                    name: 'Quill and ink',
                    encumbrance: 0
                }
            ],
            psychology: 'Random text',
            corruptionMutation: 'Another random text',
            wealth: {
                brassPennies: 10,
                silverShillings: 2,
                goldCrowns: 0
            },
            encumbrance: {
                weapons: 2,
                armour: 0,
                trappings: 1,
                total: 3,
                maximumBonus: 0,
                maximum: 4
            },
            wounds: {
                strengthBonus: 2,
                twiceToughnessBonus: 4,
                willpowerBonus: 4,
                hardy: false,
                total: 10,
                current: 0,
                notes: ''
            },
            weapons: [
                {
                    name: 'Scythe ',
                    group: 'Polearm',
                    encumbrance: 2,
                    rangeReach: 'Average',
                    damage: '+SB +6',
                    qualities: 'Damaging'
                }
            ],
            spells: [
                {
                    name: 'Dart',
                    castingNumber: 0,
                    range: '43 yards',
                    target: '1',
                    duration: 'Instant',
                    effect: 'WFRP, Page 240'
                },
                {
                    name: 'Light',
                    castingNumber: 0,
                    range: 'You',
                    target: 'You',
                    duration: '43 mins',
                    effect: 'WFRP, Page 241'
                },
                {
                    name: 'Shock',
                    castingNumber: 0,
                    range: 'Touch',
                    target: '1',
                    duration: 'Instant',
                    effect: 'WFRP, Page 242'
                }
            ],
            sin: 0,
            advantage: 0
        }
    }
];
