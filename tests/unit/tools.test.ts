import { expect } from 'chai';
import {
    trimChar,
    encodeBase64,
    decodeBase64,
    hashPassword,
    verifyPassword,
    parseQuery
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

    describe('encodeBase64 + decodeBase64', () => {
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
    });

    describe('hashPassword + verifyPassword', () => {
        it('Should hash and verify password', async () => {
            const strings = [
                'az9r5t4qz9ret4bc123',
                '987f8r4tqe95rt4qe98r4gh',
                '123654654987',
                'azeqsfzret'
            ];
            await Promise.all(
                strings.map((string) => (async () => {
                    const hash = await hashPassword(string);
                    expect(await verifyPassword(string, hash)).to.be.true;
                })())
            );
        });
    });

    describe('parseQuery', () => {
        it('Should parse URL query parameters', async () => {
            const data = {
                parameters: {
                    test: 'test',
                    stringNumber: '123',
                    stringList: 'abc,def,ghe',
                    numberList: '1,2,3'
                },
                expected: {
                    test: ['test'],
                    stringNumber: [123],
                    stringList: ['abc', 'def', 'ghe'],
                    numberList: [1, 2, 3]
                }
            };
            expect(
                parseQuery(data.parameters)
            ).to.deep.equal(
                data.expected
            );
        });
    });
});
