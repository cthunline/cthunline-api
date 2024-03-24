import { type CharacterInsert } from '../../../../src/drizzle/schema.js';

export const seventhSeaCharacters: CharacterInsert[] = [
    {
        id: 8,
        userId: 1,
        gameId: 'seventhSea',
        name: 'Ann (Pirate)',
        portrait: null,
        data: {
            biography: {
                name: 'Ann',
                concept: 'Pirate',
                nation: 'France',
                religion: 'Buddhist',
                reputations: 'Some reputation',
                wealth: 1
            },
            heroPoints: 0,
            arcana: {
                name: 'Some Arcana',
                virtue: 'A random virtue',
                hubris: 'A major hubris'
            },
            backgrounds: [
                {
                    name: 'A background',
                    description: 'Some description',
                    quirk: 'A quirk'
                }
            ],
            stories: [
                {
                    name: 'A story ',
                    goal: 'The goal of the story',
                    reward: 'And the reward',
                    steps: ['Step one is nice', 'But step two is nicer']
                }
            ],
            traits: {
                brawn: 3,
                finesse: 3,
                resolve: 3,
                wits: 2,
                panache: 4
            },
            skills: {
                aim: 1,
                athletics: 2,
                brawl: 2,
                convince: 0,
                empathy: 0,
                hide: 0,
                intimidate: 0,
                notice: 0,
                perform: 0,
                ride: 1,
                sailing: 3,
                scholarship: 0,
                tempt: 0,
                theft: 0,
                warfare: 0,
                weaponry: 2
            },
            deathSpiral: 0,
            advantages: [
                {
                    name: 'Some advantage',
                    description: 'Here is the description'
                },
                {
                    name: 'Some other advantage',
                    description: 'Here is another description'
                }
            ],
            items: 'Some items\nSome more\nAnd another one',
            notes: 'I took some notes\nHere are more notes'
        }
    },
    {
        id: 9,
        userId: 3,
        gameId: 'seventhSea',
        name: 'Zoey (Duelist)',
        portrait: null,
        data: {
            biography: {
                name: 'Zoey',
                concept: 'Duelist',
                nation: 'England',
                religion: 'Atheist',
                reputations: 'Some reputation',
                wealth: 1
            },
            heroPoints: 1,
            arcana: {
                name: 'Random arcana',
                virtue: 'A virtue',
                hubris: 'A hubris'
            },
            backgrounds: [
                {
                    name: 'Background one',
                    description: 'Some description',
                    quirk: 'A quirk'
                },
                {
                    name: 'Background two',
                    description: 'Here is a description',
                    quirk: 'Here is a quirk'
                }
            ],
            stories: [
                {
                    name: 'Hey this is a story',
                    goal: 'Some goal',
                    reward: 'Some reward',
                    steps: ['Step one', 'Step two']
                },
                {
                    name: 'Another story',
                    goal: 'Goal here',
                    reward: 'Reward here',
                    steps: ['Step one']
                }
            ],
            traits: {
                brawn: 2,
                finesse: 3,
                resolve: 3,
                wits: 2,
                panache: 3
            },
            skills: {
                aim: 2,
                athletics: 2,
                brawl: 2,
                convince: 0,
                empathy: 0,
                hide: 1,
                intimidate: 2,
                notice: 0,
                perform: 0,
                ride: 2,
                sailing: 0,
                scholarship: 0,
                tempt: 0,
                theft: 1,
                warfare: 1,
                weaponry: 3
            },
            deathSpiral: 6,
            advantages: [
                {
                    name: 'Some advantage',
                    description: 'A description'
                },
                {
                    name: 'Another advantage',
                    description: 'Another description'
                },
                {
                    name: 'Here',
                    description: 'There'
                }
            ],
            items: 'An item\nAnother item\nThe last item',
            notes: 'Some note\nHere is the other note\nAnd the final note'
        }
    }
];
