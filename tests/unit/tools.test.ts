import { expect } from 'chai';

import { sum, isInteger } from '../../src/services/tools';

describe('[Unit] Tools', () => {
    describe('sum', () => {
        it('Should sum an array of numbers', () => {
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
            data.forEach(({ numbers, expected }) => {
                expect(sum(numbers)).to.equal(expected);
            });
        });
    });

    describe('isInteger', () => {
        it('Should check if a variable is an integer', () => {
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
            data.forEach(({ value, expected }) => {
                expect(isInteger(value)).to.equal(expected);
            });
        });
    });
});
