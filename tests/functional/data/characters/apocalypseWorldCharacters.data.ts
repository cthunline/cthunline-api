import { type CharacterInsert } from '../../../../src/drizzle/schema.js';

export const apocalypseWorldCharacters: CharacterInsert[] = [
    {
        id: 12,
        userId: 1,
        gameId: 'apocalypseWorld',
        name: 'Jeanette (Hard Holder)',
        portrait: null,
        data: {
            playbook: 'hardHolder',
            bio: {
                name: 'Jeanette',
                look: 'Some description of Jeanette'
            },
            stats: {
                cool: {
                    value: '+1',
                    highlighted: false
                },
                hard: {
                    value: '+2',
                    highlighted: true
                },
                hot: {
                    value: '0',
                    highlighted: false
                },
                sharp: {
                    value: '-1',
                    highlighted: true
                },
                weird: {
                    value: '+1',
                    highlighted: false
                }
            },
            hx: [
                {
                    character: 'Sylvie',
                    value: '+2'
                }
            ],
            special: "Some description of the character's special",
            harm: {
                countdown: 0,
                stabilized: false,
                shattered: false,
                crippled: false,
                disfigured: false,
                broken: false
            },
            moves: [
                {
                    title: 'Move n° 1',
                    description: 'Here is some explanation about the move 1',
                    enabled: false
                },
                {
                    title: 'Move n° 2',
                    description: 'Here is some explanation about the move 2',
                    enabled: true
                },
                {
                    title: 'Move n° 3',
                    description: 'Here is some explanation about the move 3',
                    enabled: false
                }
            ],
            otherMoves: [
                {
                    title: 'Other move n° 1',
                    description:
                        'Here is some explanation about the other move 1',
                    enabled: true
                },
                {
                    title: 'Other move n° 2',
                    description:
                        'Here is some explanation about the other move 2',
                    enabled: true
                }
            ],
            hold: 'Some hold',
            gearAndBarter: 'Some gear / some barter',
            hardHolder: {
                holding: {
                    holdingStats: {
                        size: '100',
                        surplus: '10',
                        barter: 'Barter',
                        gigs: 'Some gigs',
                        want: 'Want'
                    },
                    gang: {
                        size: '30',
                        harm: 'Harm',
                        armor: 'Armor',
                        tags: 'Some tags'
                    },
                    advantages: [
                        {
                            title: 'Advantage n°1',
                            enabled: true
                        },
                        {
                            title: 'Advantage n°2',
                            enabled: false
                        },
                        {
                            title: 'Advantage n°3',
                            enabled: true
                        }
                    ],
                    problems: [
                        {
                            title: 'Problem n°1',
                            enabled: false
                        },
                        {
                            title: 'Problem n°2',
                            enabled: true
                        }
                    ]
                }
            }
        }
    },
    {
        id: 13,
        userId: 3,
        gameId: 'apocalypseWorld',
        name: 'Sylvie (Angel)',
        portrait: null,
        data: {
            playbook: 'angel',
            bio: {
                name: 'Jeanette',
                look: 'Some description of Sylvie'
            },
            stats: {
                cool: {
                    value: '+1',
                    highlighted: false
                },
                hard: {
                    value: '+2',
                    highlighted: true
                },
                hot: {
                    value: '0',
                    highlighted: false
                },
                sharp: {
                    value: '-1',
                    highlighted: true
                },
                weird: {
                    value: '+1',
                    highlighted: false
                }
            },
            hx: [
                {
                    character: 'Jeanette',
                    value: '+1'
                }
            ],
            special: "Some description of the character's special",
            harm: {
                countdown: 0,
                stabilized: false,
                shattered: false,
                crippled: false,
                disfigured: false,
                broken: false
            },
            moves: [
                {
                    title: 'Move n° 1',
                    description: 'Here is some explanation about the move 1',
                    enabled: true
                },
                {
                    title: 'Move n° 2',
                    description: 'Here is some explanation about the move 2',
                    enabled: false
                }
            ],
            otherMoves: [
                {
                    title: 'Other move n° 1',
                    description:
                        'Here is some explanation about the other move 1',
                    enabled: true
                }
            ],
            hold: 'Some hold',
            gearAndBarter: 'Some gear / some barter',
            angel: {
                stock: 'Some stock'
            }
        }
    }
];
