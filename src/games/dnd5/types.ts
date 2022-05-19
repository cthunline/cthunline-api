export interface DnD5Character {
    portrait: string;
    biography: DnD5Biography;
    statistics: DnD5Statistics;
    abilities: DnD5Abilities;
    savingThrows: DnD5SavingThrows;
    skills: DnD5Skills;
    combat: DnD5Combat;
    attacks: DnD5Attack[];
    features: DnD5Feature[];
    spellcasting: DnD5Spellcasting;
}

export interface DnD5Biography {
    name: string;
    class: string;
    level: number;
    background: string;
    race: string;
    alignment: string;
    description: string;
    personalityTraits: string;
    ideals: string;
    bonds: string;
    flaws: string;
    backstory: string;
    alliesAndOrganizations: string;
}

export interface DnD5Statistics {
    experiencePoints: number;
    inspiration: number;
    proficiencyBonus: number;
    passiveWisdom: number;
}

export interface DnD5Ability {
    modifier: number;
    score: number;
}

export interface DnD5Abilities {
    strength: DnD5Ability;
    dexterity: DnD5Ability;
    constitution: DnD5Ability;
    intelligence: DnD5Ability;
    wisdom: DnD5Ability;
    charisma: DnD5Ability;
}

export interface DnD5Skill {
    modifier: number;
    proficient: boolean;
}

export type DnD5SavingThrows = Record<keyof DnD5Abilities, DnD5Skill>;

export interface DnD5Skills {
    acrobatics: DnD5Skill;
    animalHandling: DnD5Skill;
    arcana: DnD5Skill;
    athletics: DnD5Skill;
    deception: DnD5Skill;
    history: DnD5Skill;
    insight: DnD5Skill;
    intimidation: DnD5Skill;
    investigation: DnD5Skill;
    medicine: DnD5Skill;
    nature: DnD5Skill;
    perception: DnD5Skill;
    performance: DnD5Skill;
    persuasion: DnD5Skill;
    religion: DnD5Skill;
    sleightOfHand: DnD5Skill;
    stealth: DnD5Skill;
    survival: DnD5Skill;
}

export interface DnD5DeathSaves {
    successes: number;
    failures: number;
}

export interface DnD5Combat {
    armorClass: number;
    initiative: number;
    speed: number;
    maxHitPoints: number;
    currentHitPoints: number;
    temporaryHitPoints: number;
    hitDice: string;
    deathSaves: DnD5DeathSaves;
}

export interface DnD5Attack {
    name: string;
    attackBonus: number;
    damage: string;
    type: string;
}

export interface DnD5Money {
    copper: number;
    silver: number;
    electrum: number;
    gold: number;
    platinum: number;
}

export interface DnD5Equipment {
    money: DnD5Money;
    items: string;
    treasure: string;
}

export interface DnD5Feature {
    name: string;
    description: string;
}

export interface DnD5Spell {
    prepared: boolean;
    name: string;
}

export interface DnD5SpellLevel {
    level: number;
    slotsTotal: number;
    slotsExpended: number;
    spells: DnD5Spell[];
}

export interface DnD5Spellcasting {
    class: string;
    spellAbility: string;
    spellSave: number;
    spellAttackBonus: number;
    cantrips: string[];
    levels: DnD5SpellLevel[];
}
