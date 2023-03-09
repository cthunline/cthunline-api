import { ParamsDictionary } from 'express-serve-static-core';

import { ValidationError } from './errors';

// trim chars on a string (at begining and end)
export const trimChar = (str: string, char: string): string => {
    let string = str;
    while (string.charAt(0) === char) {
        string = string.substring(1);
    }
    while (string.charAt(string.length - 1) === char) {
        string = string.substring(0, string.length - 1);
    }
    return string;
};

// return sum of an array of numbers
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
Parses IDs from Express path parameters object.
If ID is a number returns the integer value otherwise throws a validation error.
*/
export const parseParamId = (params: ParamsDictionary, idFieldName: string) => {
    if (params[idFieldName] && isInteger(params[idFieldName])) {
        return parseInt(params[idFieldName]);
    }
    throw new ValidationError(`Parameter ${idFieldName} is not a valid ID`);
};
