import { expect } from 'chai';
import {
    trimChar,
    sum
} from '../../src/services/tools';

describe('[Unit] Tools', () => {
    describe('trimChar', () => {
        it('Should trim char from a string', () => {
            expect(trimChar('+++abc+++def+++', '+')).to.equal('abc+++def');
            expect(trimChar('/abc/def/', '/')).to.equal('abc/def');
            expect(trimChar('abc/def/', '/')).to.equal('abc/def');
            expect(trimChar('/abc/def', '/')).to.equal('abc/def');
            expect(trimChar('///', '/')).to.equal('');
            expect(trimChar('/', '/')).to.equal('');
        });
    });

    describe('sum', () => {
        it('Should sum an array of numbers', () => {
            const data = [{
                numbers: [],
                expected: 0
            }, {
                numbers: [1, 2, 3, 4],
                expected: 10
            }, {
                numbers: [100, -100, 5],
                expected: 5
            }];
            data.forEach(({ numbers, expected }) => {
                expect(sum(numbers)).to.equal(expected);
            });
        });
    });
});
