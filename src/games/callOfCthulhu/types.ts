export interface CoCCharacter {
    biography: CoCBiography;
    characteristics: CoCCharacteristics;
    status: CoCStatus;
    skills: CoCSkill[];
    combat: CoCCombat;
    weapons: CoCWeapon[];
    story: CoCStory;
}

export interface CoCBiography {
    name: string;
    birthPlace: string;
    occupation: string;
    residence: string;
    age: number;
}

export interface CoCCharacteristic {
    regular: number;
    half: number;
    fifth: number;
}

export interface CoCPoints {
    maximum: number;
    current: number;
}

export interface CoCLuck {
    starting: number;
    current: number;
}

export interface CoCSanity {
    starting: number;
    maximum: number;
    insane: number;
    current: number;
}

export interface CoCCharacteristics {
    strength: CoCCharacteristic;
    constitution: CoCCharacteristic;
    size: CoCCharacteristic;
    dexterity: CoCCharacteristic;
    appearance: CoCCharacteristic;
    intelligence: CoCCharacteristic;
    power: CoCCharacteristic;
    education: CoCCharacteristic;
    hitPoints: CoCPoints;
    magicPoints: CoCPoints;
    luck: CoCLuck;
    sanity: CoCSanity;
}

export interface CoCStatus {
    temporaryInsanity: boolean;
    indefiniteInsanity: boolean;
    majorWound: boolean;
    unconscious: boolean;
    dying: boolean;
}

export interface CoCSkill {
    name: string;
    base: string;
    development: boolean;
    developed: boolean;
    regular: number;
    half: number;
    fifth: number;
}

export interface CoCCombat {
    move: number;
    build: number;
    damageBonus: string;
}

export interface CoCWeapon {
    name: string;
    base: string;
    damage: string;
    attacks: string;
    range: string;
    ammo: string;
    malfunction: number;
}

export interface CoCStory {
    story: string;
    personalDescription: string;
    ideologyAndBeliefs: string;
    significantPeople: string;
    meaningfulLocations: string;
    treasuredPossessions: string;
    traits: string;
    injuriesAndScars: string;
    phobiasAndManias: string;
    arcaneTomesAndSpells: string;
    encountersWithStrangeEntities: string;
    gearAndPossessions: string;
    spendingLevel: string;
    cash: string;
    assets: string;
}
