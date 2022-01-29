const Bcrypt = require('bcrypt');

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

export const hashPassword = async (password: string): Promise<string> => (
    Bcrypt.hash(password, 10)
);

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    const verify = await Bcrypt.compare(password, hash);
    return !!verify;
};

export const encodeBase64 = (str: string, keepTrailingEquals?: boolean): string => {
    const base64 = Buffer.from(str).toString('base64');
    return keepTrailingEquals ? base64 : trimChar(base64, '=');
};

export const decodeBase64 = (base64: string): string => (
    Buffer.from(base64, 'base64').toString()
);

export type RequestQuery = Record<string, (string | number)[]>;

export const parseQuery = (query: Record<string, any>): RequestQuery => {
    const parsed: RequestQuery = {};
    const parseValue = (val: string): string | number => (
        /^\d+$/.test(val) ? parseInt(val) : val
    );
    for (const key of Object.keys(query)) {
        const value = query[key];
        if (value && typeof value === 'string') {
            parsed[key] = value.split(',').map(parseValue);
        }
    }
    return parsed;
};
