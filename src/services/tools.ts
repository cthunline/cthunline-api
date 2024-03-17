import { customAlphabet } from 'nanoid';

/**
Return sum of an array of numbers
*/
export const sum = (numbers: number[]): number =>
    numbers.reduce((i, j) => i + j, 0);

/**
Check if a number is an integer. The input can be a string or a number.
*/
export const isInteger = (value: string | number) => {
    if (!/^\d+$/.test(String(value))) {
        return false;
    }
    if (Number.isNaN(value)) {
        return false;
    }
    const parsedFloat = parseFloat(String(value));
    // we allow the bitwise or syntax here because it has better performance
    // eslint-disable-next-line no-bitwise
    return (parsedFloat | 0) === parsedFloat;
};

const generateCode32 = customAlphabet('1234567890abcdef', 32);
const generateCode16 = customAlphabet('1234567890abcdef', 16);
const generateCode8 = customAlphabet('1234567890abcdef', 8);
/**
Generate a random token with length of 8, 16 or 32
*/
export const generateToken = (size: 8 | 16 | 32 = 8) => {
    if (size === 32) {
        return generateCode32();
    }
    if (size === 16) {
        return generateCode16();
    }
    return generateCode8();
};
