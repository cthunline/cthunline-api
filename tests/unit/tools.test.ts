import { describe, expect, test } from 'vitest';

import { isInteger, isObject, sum } from '../../src/services/tools.js';

describe('[Unit] Tools', () => {
    describe('sum', () => {
        test('Should sum an array of numbers', () => {
            const data = [
                {
                    numbers: [],
                    expected: 0
                },
                {
                    numbers: [1, 2, 3, 4],
                    expected: 10
                },
                {
                    numbers: [100, -100, 5],
                    expected: 5
                }
            ];
            for (const { numbers, expected } of data) {
                expect(sum(numbers)).to.equal(expected);
            }
        });
    });

    describe('isInteger', () => {
        test('Should check if a variable is an integer', () => {
            const data = [
                { value: '', expected: false },
                { value: 'aze', expected: false },
                { value: 'q1s2d', expected: false },
                { value: '0', expected: true },
                { value: '7', expected: true },
                { value: '123', expected: true },
                { value: 12.34, expected: false },
                { value: 0, expected: true },
                { value: 7, expected: true },
                { value: 123, expected: true }
            ];
            for (const { value, expected } of data) {
                expect(isInteger(value)).to.equal(expected);
            }
        });
    });

    describe('isObject', () => {
        test('Should check if a variable is an object', () => {
            const data = [
                { value: 123, expected: false },
                { value: 'aze', expected: false },
                { value: null, expected: false },
                { value: [], expected: false },
                { value: [1, 2, 3], expected: false },
                { value: {}, expected: true },
                { value: { a: 1, b: 2 }, expected: true }
            ];
            for (const { value, expected } of data) {
                expect(isObject(value)).to.equal(expected);
            }
        });
    });
});
