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
export const sum = (numbers: number[]): number => (
    numbers.reduce((i, j) => i + j, 0)
);
