export interface CoCCharacter {
    biography: CoCBiography;
    characteristics: CoCCharacteristics;
    points: CoCPoints;
    luck: CoCLuck;
    sanity: CoCSanity;
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
    hitPoints: CoCPoint;
    magicPoints: CoCPoint;
}

export interface CoCPoint {
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
    build: string;
    damageBonus: string;
}

export interface CoCWeapon {
    name: string;
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
    fellowInvestigators: string;
    spendingLevel: string;
    cash: string;
    assets: string;
}
