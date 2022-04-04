export interface SWD6Character {
    portrait: string;
    biography: SWD6Biography;
    attributes: SWD6Attributes;
    abilities: string[];
    statistics: SWD6Statistics;
    woundStatus: SWD6WoundStatus;
    weapons: SWD6Weapon[];
    story: SWD6Story;
}

export interface SWD6Biography {
    name: string;
    occupation: string;
    species: string;
    age: number;
    height: string;
    weight: string;
    description: string;
}

export interface SWD6Attributes {
    dexterity: SWD6Attribute;
    knowledge: SWD6Attribute;
    mechanical: SWD6Attribute;
    perception: SWD6Attribute;
    strength: SWD6Attribute;
    technical: SWD6Attribute;
}

export interface SWD6Attribute {
    value: string;
    skills: SWD6Skill[];
}

export interface SWD6Skill {
    name: string;
    value: string;
}

export interface SWD6Statistics {
    move: number;
    forceSensitive: boolean;
    forcePoints: number;
    darkSidePoints: number;
    characterPoints: number;
}

export interface SWD6WoundStatus {
    stunned: boolean;
    wounded: boolean;
    doublyWounded: boolean;
    incapacitated: boolean;
    mortallyWounded: boolean;
}

export interface SWD6Story {
    equipment: string;
    background: string;
    personality: string;
    objectives: string;
    quote: string;
    connections: string;
}

export interface SWD6Weapon {
    name: string;
    damage: string;
    shortRange: string;
    mediumRange: string;
    longRange: string;
    ammo: string;
}
