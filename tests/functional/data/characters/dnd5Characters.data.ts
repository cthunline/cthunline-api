import type { CharacterInsert } from '../../../../src/drizzle/schema.js';

export const dnd5Characters: CharacterInsert[] = [
    {
        id: 6,
        userId: 3,
        gameId: 'dnd5',
        name: 'Lucy (Soldier)',
        portrait: null,
        data: {
            biography: {
                name: 'Lucy',
                class: 'Warrior',
                level: 1,
                background: 'Soldier',
                race: 'Human',
                alignment: 'Neutral Good',
                description: 'Lucy is a warrior'
            },
            story: {
                backstory: 'Lucy has a random story',
                personalityTraits: 'Random personality trait',
                ideals: 'Random ideal',
                bonds: 'Random bond',
                flaws: 'Random flaw',
                alliesAndOrganizations: 'Random ally\nRandom organization'
            },
            statistics: {
                experiencePoints: 0,
                inspiration: 0,
                proficiencyBonus: 1,
                passiveWisdom: 9
            },
            abilities: {
                strength: {
                    modifier: 2,
                    score: 14
                },
                dexterity: {
                    modifier: 2,
                    score: 15
                },
                constitution: {
                    modifier: 1,
                    score: 13
                },
                intelligence: {
                    modifier: 0,
                    score: 11
                },
                wisdom: {
                    modifier: -1,
                    score: 9
                },
                charisma: {
                    modifier: 0,
                    score: 11
                }
            },
            savingThrows: {
                strength: {
                    modifier: 3,
                    proficient: true
                },
                dexterity: {
                    modifier: 2,
                    proficient: false
                },
                constitution: {
                    modifier: 1,
                    proficient: false
                },
                intelligence: {
                    modifier: 0,
                    proficient: false
                },
                wisdom: {
                    modifier: -1,
                    proficient: false
                },
                charisma: {
                    modifier: 0,
                    proficient: false
                }
            },
            skills: {
                acrobatics: {
                    modifier: 3,
                    proficient: true
                },
                animalHandling: {
                    modifier: -1,
                    proficient: false
                },
                arcana: {
                    modifier: 0,
                    proficient: false
                },
                athletics: {
                    modifier: 3,
                    proficient: true
                },
                deception: {
                    modifier: 0,
                    proficient: false
                },
                history: {
                    modifier: 0,
                    proficient: false
                },
                insight: {
                    modifier: -1,
                    proficient: false
                },
                intimidation: {
                    modifier: 1,
                    proficient: true
                },
                investigation: {
                    modifier: 0,
                    proficient: false
                },
                medicine: {
                    modifier: -1,
                    proficient: false
                },
                nature: {
                    modifier: 0,
                    proficient: false
                },
                perception: {
                    modifier: -1,
                    proficient: false
                },
                performance: {
                    modifier: 0,
                    proficient: false
                },
                persuasion: {
                    modifier: 0,
                    proficient: false
                },
                religion: {
                    modifier: 0,
                    proficient: false
                },
                sleightOfHand: {
                    modifier: 2,
                    proficient: false
                },
                stealth: {
                    modifier: 2,
                    proficient: false
                },
                survival: {
                    modifier: -1,
                    proficient: false
                }
            },
            combat: {
                armorClass: 10,
                initiative: 2,
                speed: 10,
                hitPoints: {
                    current: 10,
                    maximum: 10,
                    temporary: 0
                },
                hitDice: '1d8',
                deathSaves: {
                    successes: 0,
                    failures: 0
                }
            },
            attacks: [
                {
                    name: 'Sword',
                    attackBonus: 3,
                    damage: '1d8',
                    type: 'Slashing'
                },
                {
                    name: 'Head butt',
                    attackBonus: 3,
                    damage: '1d4',
                    type: 'Bludgeoning'
                }
            ],
            equipment: {
                money: {
                    copper: 10,
                    silver: 6,
                    electrum: 0,
                    gold: 1,
                    platinum: 0
                },
                items: 'Travel bag\nBasic camp material',
                treasure: 'Gold necklace'
            },
            features: {
                featuresAndTraits: 'Random feature\nAnother andom feature',
                proficienciesAndLanguages: 'Random language'
            },
            spellcasting: {
                class: '',
                spellAbility: 0,
                spellSaveDC: 0,
                spellAttackBonus: 0,
                cantrips: [],
                levels: []
            }
        }
    },
    {
        id: 7,
        userId: 2,
        gameId: 'dnd5',
        name: 'Ada (Prophet)',
        portrait: null,
        data: {
            biography: {
                name: 'Ada',
                class: 'Mage',
                level: 3,
                background: 'Prophet',
                race: 'Human',
                alignment: 'Chaotic Good',
                description: 'Ada is a mage'
            },
            story: {
                backstory: 'Ada is a prophet',
                personalityTraits: 'Random personality trait\nAnother one',
                ideals: 'Some ideals',
                bonds: 'Some bonds\nAnd another',
                flaws: 'Some flaw',
                alliesAndOrganizations: 'Some allies\nAnd an organization'
            },
            statistics: {
                experiencePoints: 3,
                inspiration: 1,
                proficiencyBonus: 2,
                passiveWisdom: 12
            },
            abilities: {
                strength: {
                    modifier: -1,
                    score: 9
                },
                dexterity: {
                    modifier: 0,
                    score: 11
                },
                constitution: {
                    modifier: 0,
                    score: 10
                },
                intelligence: {
                    modifier: 2,
                    score: 15
                },
                wisdom: {
                    modifier: 2,
                    score: 14
                },
                charisma: {
                    modifier: 2,
                    score: 14
                }
            },
            savingThrows: {
                strength: {
                    modifier: -1,
                    proficient: false
                },
                dexterity: {
                    modifier: 0,
                    proficient: false
                },
                constitution: {
                    modifier: 0,
                    proficient: false
                },
                intelligence: {
                    modifier: 4,
                    proficient: true
                },
                wisdom: {
                    modifier: 4,
                    proficient: true
                },
                charisma: {
                    modifier: 2,
                    proficient: false
                }
            },
            skills: {
                acrobatics: {
                    modifier: 0,
                    proficient: false
                },
                animalHandling: {
                    modifier: 2,
                    proficient: false
                },
                arcana: {
                    modifier: 4,
                    proficient: true
                },
                athletics: {
                    modifier: -1,
                    proficient: false
                },
                deception: {
                    modifier: 2,
                    proficient: false
                },
                history: {
                    modifier: 4,
                    proficient: true
                },
                insight: {
                    modifier: 2,
                    proficient: false
                },
                intimidation: {
                    modifier: 2,
                    proficient: false
                },
                investigation: {
                    modifier: 2,
                    proficient: false
                },
                medicine: {
                    modifier: 2,
                    proficient: false
                },
                nature: {
                    modifier: 2,
                    proficient: false
                },
                perception: {
                    modifier: 2,
                    proficient: false
                },
                performance: {
                    modifier: 2,
                    proficient: false
                },
                persuasion: {
                    modifier: 2,
                    proficient: false
                },
                religion: {
                    modifier: 4,
                    proficient: true
                },
                sleightOfHand: {
                    modifier: 0,
                    proficient: false
                },
                stealth: {
                    modifier: 0,
                    proficient: false
                },
                survival: {
                    modifier: 2,
                    proficient: false
                }
            },
            combat: {
                armorClass: 5,
                initiative: 0,
                speed: 10,
                hitPoints: {
                    current: 8,
                    maximum: 8,
                    temporary: 2
                },
                hitDice: '1D4',
                deathSaves: {
                    successes: 0,
                    failures: 0
                }
            },
            attacks: [
                {
                    name: 'Mage staff',
                    attackBonus: 1,
                    damage: '1D6',
                    type: ''
                }
            ],
            equipment: {
                money: {
                    copper: 10,
                    silver: 5,
                    electrum: 6,
                    gold: 3,
                    platinum: 0
                },
                items: 'Some items\nAnother item',
                treasure: 'A small treasure'
            },
            features: {
                featuresAndTraits: 'Some features',
                proficienciesAndLanguages: 'Some languages\nAnd another one'
            },
            spellcasting: {
                class: 'Mage',
                spellAbility: 2,
                spellSaveDC: 2,
                spellAttackBonus: 3,
                cantrips: ['Light a room with the mage staff'],
                levels: [
                    {
                        level: 1,
                        slotsTotal: 3,
                        slotsExpended: 2,
                        spells: [
                            {
                                prepared: true,
                                name: 'Make some magic stuff'
                            },
                            {
                                prepared: true,
                                name: 'Make more magic stuff'
                            }
                        ]
                    },
                    {
                        level: 2,
                        slotsTotal: 3,
                        slotsExpended: 2,
                        spells: [
                            {
                                prepared: true,
                                name: 'Make a lot of magic stuff'
                            },
                            {
                                prepared: false,
                                name: 'Make a big magic stuff'
                            }
                        ]
                    },
                    {
                        level: 3,
                        slotsTotal: 2,
                        slotsExpended: 1,
                        spells: [
                            {
                                prepared: false,
                                name: 'Make random magic stuff'
                            }
                        ]
                    }
                ]
            }
        }
    }
];
