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

// check if string is valid base64
export const isBase64 = (str: string, mimeTypes?: string | string[]): boolean => {
    let mimeTypeRegex = '(?:[a-z]+)\\/(?:[a-z]+)';
    if (mimeTypes) {
        const properMimeTypes = Array.isArray(mimeTypes) ? mimeTypes : [mimeTypes];
        const escapedMimeTypes = properMimeTypes.map((mime) => mime.replace('/', '\\/'));
        mimeTypeRegex = `(?:${escapedMimeTypes.join('|')})`;
    }
    const base64Regex = new RegExp(
        `^data:${mimeTypeRegex};base64,(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$`
    );
    return base64Regex.test(str);
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

// parse an environment variable into a boolean
export const booleanEnv = (
    envVar: string | undefined,
    defaultBoolean: boolean = false
) => {
    const defaultString = defaultBoolean ? '1' : '0';
    return !!parseInt(envVar ?? defaultString);
};
