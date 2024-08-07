import type { CharacterInsert } from '../../../../src/drizzle/schema.js';

export const swd6Characters: CharacterInsert[] = [
    {
        id: 4,
        userId: 1,
        gameId: 'starWarsD6',
        name: 'Emma Nostaw (Bounty hunter)',
        portrait: null,
        data: {
            biography: {
                name: 'Emma Nostaw',
                occupation: 'Bounty hunter',
                species: 'Human',
                age: 24,
                height: '1m76',
                weight: '65kg',
                description:
                    'Sed eligendi beatae sed facilis praesentium ea esse odio eos quia'
            },
            attributes: {
                dexterity: {
                    value: '4D',
                    skills: [
                        {
                            name: 'Blaster',
                            value: '5D'
                        },
                        {
                            name: 'Dodge',
                            value: '4D'
                        },
                        {
                            name: 'Melee combat',
                            value: '5D'
                        },
                        {
                            name: 'Melee parry',
                            value: '4D'
                        },
                        {
                            name: 'Thrown weapons',
                            value: '4D'
                        },
                        {
                            name: 'Vehicle blasters',
                            value: '4D'
                        }
                    ]
                },
                knowledge: {
                    value: '2D+2',
                    skills: [
                        {
                            name: 'Intimidation',
                            value: '2D+2'
                        },
                        {
                            name: 'Law enforcement',
                            value: '2D+2'
                        },
                        {
                            name: 'Planetary systems',
                            value: '3D+2'
                        },
                        {
                            name: 'Streetwise',
                            value: '3D+2'
                        },
                        {
                            name: 'Survival',
                            value: '2D+2'
                        }
                    ]
                },
                mechanical: {
                    value: '2D+2',
                    skills: [
                        {
                            name: 'Beast riding',
                            value: '2D+2'
                        },
                        {
                            name: 'Jetpack operation',
                            value: '3D+2'
                        },
                        {
                            name: 'Repulsorlift operation',
                            value: '2D+2'
                        },
                        {
                            name: 'Sensors',
                            value: '2D+2'
                        },
                        {
                            name: 'Space transports',
                            value: '3D+2'
                        },
                        {
                            name: 'Swoop operation',
                            value: '2D+2'
                        }
                    ]
                },
                perception: {
                    value: '3D',
                    skills: [
                        {
                            name: 'Bargain',
                            value: '3D'
                        },
                        {
                            name: 'Con',
                            value: '3D'
                        },
                        {
                            name: 'Forgery',
                            value: '3D'
                        },
                        {
                            name: 'Hide',
                            value: '3D'
                        },
                        {
                            name: 'Persuasion',
                            value: '3D'
                        },
                        {
                            name: 'Search',
                            value: '3D'
                        },
                        {
                            name: 'Sneak',
                            value: '3D'
                        }
                    ]
                },
                strength: {
                    value: '3D+2',
                    skills: [
                        {
                            name: 'Brawling',
                            value: '3D+2'
                        },
                        {
                            name: 'Climbing / Jumping',
                            value: '3D+2'
                        },
                        {
                            name: 'Lifting',
                            value: '3D+2'
                        },
                        {
                            name: 'Stamina',
                            value: '3D+2'
                        },
                        {
                            name: 'Swimming',
                            value: '3D+2'
                        }
                    ]
                },
                technical: {
                    value: '2D',
                    skills: [
                        {
                            name: 'Armor repair',
                            value: '2D'
                        },
                        {
                            name: 'Blaster repair',
                            value: '2D'
                        },
                        {
                            name: 'Demolitions',
                            value: '2D'
                        },
                        {
                            name: 'First aid',
                            value: '2D'
                        },
                        {
                            name: 'Security',
                            value: '3D'
                        }
                    ]
                }
            },
            abilities: [],
            statistics: {
                move: 10,
                forceSensitive: false,
                forcePoints: 0,
                darkSidePoints: 0,
                characterPoints: 0
            },
            woundStatus: {
                stunned: false,
                wounded: false,
                doublyWounded: false,
                incapacitated: false,
                mortallyWounded: false
            },
            weapons: [
                {
                    name: 'Heavyblaster pistol',
                    damage: '5D',
                    shortRange: '3-7',
                    mediumRange: '25',
                    longRange: '50',
                    ammo: '25'
                },
                {
                    name: 'Hold-out blaster',
                    damage: '3D',
                    shortRange: '3-4',
                    mediumRange: '8',
                    longRange: '12',
                    ammo: '6'
                },
                {
                    name: 'Knive',
                    damage: 'STR+1D',
                    shortRange: '',
                    mediumRange: '',
                    longRange: '',
                    ammo: ''
                },
                {
                    name: 'Thermal detonator',
                    damage: '10D',
                    shortRange: '3-4',
                    mediumRange: '7',
                    longRange: '12',
                    ammo: ''
                }
            ],
            story: {
                equipment:
                    'Protective vest (+2 energy, +1D physical to torso)\nJet pack\n2 medpacs\n1000 credits',
                background:
                    'Lorem ipsum dolor sit amet. Aut voluptatum pariatur ea internos beatae sapiente quia aut sapiente molestiae cum nostrum officia in velit error. Qui error delectus et sequi maiores est consequatur reprehenderit.',
                personality:
                    'Ut dolorum reprehenderit ut suscipit sunt vel maxime quidem quo error dolor sit galisum voluptatem in officia ipsum.',
                objectives:
                    'Aut quas cumque aut atque galisum ex earum assumenda ut consequatur quia et assumenda facilis et suscipit laudantium non quia laudantium. ',
                quote: 'Sit facere dolorem et velit fuga!',
                connections: ''
            }
        }
    },
    {
        id: 5,
        userId: 3,
        gameId: 'starWarsD6',
        name: 'Selma Ahcab (Rebel pilot)',
        portrait: null,
        data: {
            biography: {
                name: 'Selma Ahcab',
                occupation: 'Rebel pilot',
                species: 'Human',
                age: 27,
                height: '1m70',
                weight: '58kg',
                description:
                    'Est atque distinctio quo natus facilis qui porro sunt'
            },
            attributes: {
                dexterity: {
                    value: '3D',
                    skills: [
                        {
                            name: 'Blaster',
                            value: '4D'
                        },
                        {
                            name: 'Brawling parry',
                            value: '3D'
                        },
                        {
                            name: 'Dodge',
                            value: '3D'
                        },
                        {
                            name: 'Melee Combat',
                            value: '3D'
                        },
                        {
                            name: 'Vehicle blasters',
                            value: '3D'
                        }
                    ]
                },
                knowledge: {
                    value: '2D',
                    skills: [
                        {
                            name: 'Intimidation',
                            value: '2D'
                        },
                        {
                            name: 'Planetary systems',
                            value: '3D'
                        },
                        {
                            name: 'Streetwise',
                            value: '2D'
                        },
                        {
                            name: 'Survival',
                            value: '2D'
                        },
                        {
                            name: 'Value',
                            value: '2D'
                        },
                        {
                            name: 'Willpower',
                            value: '2D'
                        }
                    ]
                },
                mechanical: {
                    value: '4D',
                    skills: [
                        {
                            name: 'Astrogation',
                            value: '5D'
                        },
                        {
                            name: 'Communications',
                            value: '4D'
                        },
                        {
                            name: 'Repulsorlift operation',
                            value: '4D'
                        },
                        {
                            name: 'Sensors',
                            value: '5D'
                        },
                        {
                            name: 'Space transports',
                            value: '5D'
                        },
                        {
                            name: 'Starfighter piloting',
                            value: '5D'
                        },
                        {
                            name: 'Starship gunnery',
                            value: '4D'
                        }
                    ]
                },
                perception: {
                    value: '3D',
                    skills: [
                        {
                            name: 'Command',
                            value: '3D'
                        },
                        {
                            name: 'Con',
                            value: '3D'
                        },
                        {
                            name: 'Gambling',
                            value: '3D'
                        },
                        {
                            name: 'Persuasion',
                            value: '3D'
                        },
                        {
                            name: 'Search',
                            value: '3D'
                        },
                        {
                            name: 'Sneak',
                            value: '3D'
                        }
                    ]
                },
                strength: {
                    value: '3D',
                    skills: [
                        {
                            name: 'Brawling',
                            value: '3D'
                        },
                        {
                            name: 'Stamina',
                            value: '3D'
                        },
                        {
                            name: 'Swimming',
                            value: '3D'
                        }
                    ]
                },
                technical: {
                    value: '3D',
                    skills: [
                        {
                            name: 'Blaster repair',
                            value: '3D'
                        },
                        {
                            name: 'Droid repair',
                            value: '3D'
                        },
                        {
                            name: 'Repulsorlift repair',
                            value: '3D'
                        },
                        {
                            name: 'Starfighter repair',
                            value: '4D'
                        }
                    ]
                }
            },
            abilities: [],
            statistics: {
                move: 10,
                forceSensitive: false,
                forcePoints: 0,
                darkSidePoints: 0,
                characterPoints: 0
            },
            woundStatus: {
                stunned: false,
                wounded: false,
                doublyWounded: false,
                incapacitated: false,
                mortallyWounded: false
            },
            weapons: [
                {
                    name: 'Blaster pistol',
                    damage: '4D',
                    shortRange: '3-10',
                    mediumRange: '30',
                    longRange: '120',
                    ammo: '100'
                }
            ],
            story: {
                equipment: 'Rebel uniform\nVacuum suit\n1000 credits',
                background:
                    'Rem repellendus assumenda quo eligendi animi et harum soluta aut saepe nihil sed nihil tenetur quo fugiat laudantium aut ratione facilis',
                personality:
                    'Ut nihil aspernatur eum commodi quam ab cumque soluta',
                objectives:
                    'Ut suscipit officiis qui doloribus officiis aspernatur totam et galisum autem ex ipsa veniam',
                quote: 'Non cumque minima eum repellat aut Quis veniam...',
                connections: ''
            }
        }
    }
];
