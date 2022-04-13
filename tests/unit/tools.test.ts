import { expect } from 'chai';
import {
    trimChar,
    isBase64,
    encodeBase64,
    decodeBase64,
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

    describe('base64', () => {
        it('Should encode and decode base64', () => {
            const strings = [
                'az9r5t4qz9ret4bc123',
                '987f8r4tqe95rt4qe98r4gh',
                '123654654987',
                'azeqsfzret'
            ];
            strings.forEach((string) => {
                const encoded = encodeBase64(string);
                const decoded = decodeBase64(encoded);
                expect(decoded).to.equal(string);
            });
        });
        it('Should verify a base64 string', () => {
            const pngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAFCAIAAADtz9qMAAAACXBIWXMAAA+IAAAPiAEWyKWGAAAAE0lEQVQIW2OUkJJmgAEmOIt4DgAUdgBX4wBxVAAAAABJRU5ErkJggg==';
            const data = [
                { string: pngBase64, mimeTypes: undefined, expected: true },
                { string: pngBase64, mimeTypes: ['image/png', 'image/jpg'], expected: true },
                { string: pngBase64, mimeTypes: 'image/png', expected: true },
                { string: pngBase64, mimeTypes: ['audio/mp3', 'image/jpg'], expected: false },
                { string: pngBase64, mimeTypes: 'audio/mp3', expected: false },
                { string: 'invalid', mimeTypes: ['image/png', 'image/jpg'], expected: false },
                { string: 'invalid', mimeTypes: 'image/png', expected: false },
                { string: 'invalid', mimeTypes: undefined, expected: false }
            ];
            data.forEach(({ string, mimeTypes, expected }) => {
                expect(
                    isBase64(string, mimeTypes)
                ).to.equal(expected);
            });
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
