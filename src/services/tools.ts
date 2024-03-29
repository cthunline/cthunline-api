import { customAlphabet } from 'nanoid';
import path from 'path';
import url from 'url';

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

/**
Check if a variale is a JS object
*/
export const isObject = (val: any): val is object =>
    typeof val === 'object' && val !== null && !Array.isArray(val);

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

/**
Returns the current dirname from ESM's import.meta.url
*/
export const importMetaUrlDirname = (importMetaUrl: string) =>
    path.dirname(url.fileURLToPath(importMetaUrl));

const timeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
/**
Set a timeout with a given key. If a timeout with the same key
already exists clear it and replace it.
*/
export const resetTimeout = (
    key: string,
    task: () => void | Promise<void>,
    timerMs: number = 0
) => {
    const timeout = timeouts.get(key);
    if (timeout) {
        clearTimeout(timeout);
        timeouts.delete(key);
    }
    timeouts.set(key, setTimeout(task, timerMs));
};
