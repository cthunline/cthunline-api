import type { CharacterInsert } from '../../../../src/drizzle/schema.js';

export const alienCharacters: CharacterInsert[] = [
    {
        id: 14,
        userId: 1,
        gameId: 'alien',
        name: 'Ellie (Scientist)',
        portrait: null,
        data: {
            biography: {
                name: 'Ellie',
                career: 'Scientist',
                appearance: '53 y.o., brown hair, glasses',
                personalAgenda:
                    'To make sure the 26 Draconis Strain does not become a threat to human civilization'
            },
            relationships: {
                buddy: 'Sarah',
                rival: 'Mary'
            },
            attributes: {
                agility: {
                    value: 3,
                    skills: {
                        mobility: 1,
                        piloting: 0,
                        rangedCombat: 0
                    }
                },
                empathy: {
                    value: 4,
                    skills: {
                        command: 0,
                        manipulation: 1,
                        medicalAid: 3
                    }
                },
                strength: {
                    value: 2,
                    skills: {
                        closeCombat: 0,
                        heavyMachinery: 0,
                        stamina: 0
                    }
                },
                wits: {
                    value: 5,
                    skills: {
                        comtech: 3,
                        observation: 2,
                        survival: 0
                    }
                }
            },
            talents: ['Analyze'],
            status: {
                stressLevel: 0,
                health: 2,
                radiation: 0,
                criticalInjuries: [],
                conditions: {
                    starving: false,
                    dehydrated: false,
                    exhausted: false,
                    freezing: false
                }
            },
            consumables: {
                air: 0,
                food: 0,
                power: 0,
                water: 0
            },
            equipment: {
                armor: {
                    name: '',
                    rating: 0
                },
                weapons: [],
                encumbrance: 0,
                gear: ['Personal data tablet'],
                signatureItem: '',
                tinyItems: []
            },
            experience: {
                experiencePoints: 0,
                storyPoints: 0
            }
        }
    },
    {
        id: 15,
        userId: 3,
        gameId: 'alien',
        name: 'Sarah (Marine)',
        portrait: null,
        data: {
            biography: {
                name: 'Sarah',
                career: 'Marine',
                appearance: '34 y.o., blond hair, muscular',
                personalAgenda:
                    'Terminate all threats to the Cronus crew with extreme prejudice, no matter the risks for you'
            },
            relationships: {
                buddy: 'Mary',
                rival: 'Ellie'
            },
            attributes: {
                agility: {
                    value: 4,
                    skills: {
                        mobility: 2,
                        piloting: 0,
                        rangedCombat: 3
                    }
                },
                empathy: {
                    value: 3,
                    skills: {
                        command: 1,
                        manipulation: 0,
                        medicalAid: 0
                    }
                },
                strength: {
                    value: 5,
                    skills: {
                        closeCombat: 3,
                        heavyMachinery: 1,
                        stamina: 0
                    }
                },
                wits: {
                    value: 2,
                    skills: {
                        comtech: 0,
                        observation: 0,
                        survival: 0
                    }
                }
            },
            talents: ['Overkill'],
            status: {
                stressLevel: 0,
                health: 5,
                radiation: 0,
                criticalInjuries: [],
                conditions: {
                    starving: false,
                    dehydrated: false,
                    exhausted: false,
                    freezing: false
                }
            },
            consumables: {
                air: 0,
                food: 0,
                power: 0,
                water: 0
            },
            equipment: {
                armor: {
                    name: '',
                    rating: 0
                },
                weapons: [
                    {
                        name: 'Armat 37A2 12 Shotgun',
                        bonus: 2,
                        damage: 3,
                        range: 'Short'
                    }
                ],
                encumbrance: 0,
                gear: [],
                signatureItem: '',
                tinyItems: []
            },
            experience: {
                experiencePoints: 0,
                storyPoints: 0
            }
        }
    }
];
