import Chai, { expect } from 'chai';
import DeepEqualInAnyOrder from 'deep-equal-in-any-order';

Chai.use(DeepEqualInAnyOrder);

const ChaiDateString = require('chai-date-string');

ChaiDateString(Chai);

declare global {
    export namespace Chai {
        interface Assertion {
            dateString(): void;
        }
    }
}

export const assertUser = (
    data: Record<string, any>,
    expected?: Record<string, any>
) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('id');
    expect(data.id).to.be.a('string');
    expect(data).to.have.property('name');
    expect(data.name).to.be.a('string');
    expect(data).to.have.property('email');
    expect(data.email).to.be.a('string');
    expect(data).to.have.property('isAdmin');
    expect(data.isAdmin).to.be.a('boolean');
    expect(data).to.not.have.property('password');
    if (expected) {
        const {
            password,
            oldPassword,
            ...expectedWithoutPassword
        } = expected;
        Object.keys(expectedWithoutPassword).forEach((key) => {
            expect(data).to.have.property(key);
            expect(data[key]).to.equal(expected[key]);
        });
    }
};

export const assertAsset = (
    data: Record<string, any>,
    expected?: Record<string, any>
) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('id');
    expect(data.id).to.be.a('string');
    expect(data).to.have.property('type');
    expect(data.type).to.be.a('string');
    expect(data).to.have.property('name');
    expect(data.name).to.be.a('string');
    expect(data).to.have.property('path');
    expect(data.path).to.be.a('string');
    expect(data).to.have.property('path');
    expect(data.path).to.be.a('string');
    expect(data).to.have.property('userId');
    expect(data.userId).to.be.a('string');
    if (expected) {
        Object.keys(expected).forEach((key) => {
            expect(data).to.have.property(key);
            expect(data[key]).to.equal(expected[key]);
        });
    }
};

export const assertGame = (
    data: Record<string, any>,
    expected?: Record<string, any>
) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('id');
    expect(data.id).to.be.a('string');
    expect(data).to.have.property('name');
    expect(data.name).to.be.a('string');
    if (expected) {
        Object.keys(expected).forEach((key) => {
            expect(data).to.have.property(key);
            expect(data[key]).to.equal(expected[key]);
        });
    }
};

export const assertSketchImage = (data: Record<string, any>) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('url');
    expect(data.url).to.be.a('string');
    expect(data).to.have.property('width');
    expect(data.width).to.be.a('number');
    expect(data).have.property('height');
    expect(data.height).to.be.a('number');
    expect(data).to.have.property('x');
    expect(data.x).to.be.a('number');
    expect(data).to.have.property('y');
    expect(data.y).to.be.a('number');
};

export const assertSketch = (
    data: Record<string, any>,
    expected?: Record<string, any>
) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('displayed');
    expect(data.displayed).to.be.a('boolean');
    expect(data).to.have.property('paths');
    data.paths.forEach((path: any) => {
        expect(path).to.be.a('string');
    });
    expect(data.paths).to.be.an('array');
    expect(data).to.have.property('images');
    expect(data.images).to.be.an('array');
    data.images.forEach((image: any) => {
        assertSketchImage(image);
    });
    if (expected) {
        expect(data).to.deep.equalInAnyOrder(expected);
    }
};

export const assertSession = (
    data: Record<string, any>,
    expected?: Record<string, any>
) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('id');
    expect(data.id).to.be.a('string');
    expect(data).to.have.property('name');
    expect(data.name).to.be.a('string');
    expect(data).to.have.property('sketch');
    expect(data.sketch).to.be.an('object');
    if (expected) {
        Object.keys(expected).forEach((key) => {
            if (key !== 'sketch') {
                expect(data).to.have.property(key);
                expect(data[key]).to.equal(expected[key]);
            }
        });
    }
    assertSketch(data.sketch, expected?.sketch);
};

export const assertCharacter = (
    data: Record<string, any>,
    expected?: Record<string, any>
) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('id');
    expect(data.id).to.be.a('string');
    expect(data).to.have.property('userId');
    expect(data.id).to.be.a('string');
    expect(data).to.have.property('gameId');
    expect(data.id).to.be.a('string');
    expect(data).to.have.property('name');
    expect(data.id).to.be.a('string');
    if (expected) {
        Object.keys(expected).forEach((key) => {
            if (key === 'data') {
                expect(data[key]).to.deep.equalInAnyOrder(expected[key]);
            } else {
                expect(data).to.have.property(key);
                expect(data[key]).to.equal(expected[key]);
            }
        });
    }
};

export const assertToken = (
    data: Record<string, any>,
    expected?: Record<string, any>
) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('userId');
    expect(data.userId).to.be.a('string');
    expect(data).to.have.property('bearer');
    expect(data.bearer).to.be.a('string');
    expect(data).to.have.property('limit');
    expect(data.limit).to.be.a.dateString();
    if (expected) {
        Object.keys(expected).forEach((key) => {
            expect(data).to.have.property(key);
            expect(data[key]).to.equal(expected[key]);
        });
    }
};

export const assertError = (data: Record<string, any>) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('error');
    expect(data.error).to.be.a('string');
};
