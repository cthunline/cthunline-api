import path from 'node:path';
import url from 'node:url';
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
    const parsedFloat = Number.parseFloat(String(value));
    // we allow the bitwise or syntax here because it has better performance
    return (parsedFloat | 0) === parsedFloat;
};

/**
Check if a variale is a JS object
*/
export const isObject = (val: unknown): val is object =>
    typeof val === 'object' && val !== null && !Array.isArray(val);

const generateToken32 = customAlphabet('1234567890abcdef', 32);
const generateToken16 = customAlphabet('1234567890abcdef', 16);
const generateToken8 = customAlphabet('1234567890abcdef', 8);
/**
Generate a random token with length of 8, 16 or 32
*/
export const generateToken = (size: 8 | 16 | 32 = 8) => {
    if (size === 32) {
        return generateToken32();
    }
    if (size === 16) {
        return generateToken16();
    }
    return generateToken8();
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
    timerMs = 0
) => {
    const timeout = timeouts.get(key);
    if (timeout) {
        clearTimeout(timeout);
        timeouts.delete(key);
    }
    timeouts.set(key, setTimeout(task, timerMs));
};
