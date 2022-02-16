const Bcrypt = require('bcrypt');

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

// hash a string
export const hashPassword = async (password: string): Promise<string> => (
    Bcrypt.hash(password, 10)
);

// validate hash against string
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    const verify = await Bcrypt.compare(password, hash);
    return !!verify;
};

// encode string to base64
export const encodeBase64 = (str: string, keepTrailingEquals?: boolean): string => {
    const base64 = Buffer.from(str).toString('base64');
    return keepTrailingEquals ? base64 : trimChar(base64, '=');
};

// decode base64 string
export const decodeBase64 = (base64: string): string => (
    Buffer.from(base64, 'base64').toString()
);

// return sum of an array of numbers
export const sum = (numbers: number[]): number => (
    numbers.reduce((i, j) => i + j, 0)
);
