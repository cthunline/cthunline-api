import Chai, { expect } from 'chai';
import DeepEqualInAnyOrder from 'deep-equal-in-any-order';

import { locales } from '../../../src/types/configuration';

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

export const compareDataWithExpected = (
    data: Record<string, any>,
    expected: Record<string, any>
) => {
    Object.keys(expected).forEach((key) => {
        expect(data).to.have.property(key);
        expect(data[key]).to.equal(expected[key]);
    });
};

export const assertUser = (
    data: Record<string, any>,
    expected?: Record<string, any>
) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('id');
    expect(data.id).to.be.a('number');
    expect(data).to.have.property('name');
    expect(data.name).to.be.a('string');
    expect(data).to.have.property('email');
    expect(data.email).to.be.a('string');
    expect(data).to.have.property('theme');
    expect(data.theme).to.be.oneOf(['dark', 'light']);
    expect(data).to.have.property('locale');
    expect(data.locale).to.be.oneOf(locales);
    expect(data).to.have.property('isAdmin');
    expect(data.isAdmin).to.be.a('boolean');
    expect(data).to.not.have.property('password');
    if (expected) {
        const {
            password,
            oldPassword,
            ...expectedWithoutPassword
        } = expected;
        compareDataWithExpected(data, expectedWithoutPassword);
    }
};

export const assertAsset = (
    data: Record<string, any>,
    expected?: Record<string, any>
) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('id');
    expect(data.id).to.be.a('number');
    expect(data).to.have.property('type');
    expect(data.type).to.be.a('string');
    expect(data).to.have.property('name');
    expect(data.name).to.be.a('string');
    expect(data).to.have.property('path');
    expect(data.path).to.be.a('string');
    expect(data).to.have.property('userId');
    expect(data.userId).to.be.a('number');
    if (data.directoryId) {
        expect(data.directoryId).to.satisfy((id: any) => (
            id === null || typeof id === 'number'
        ));
    }
    if (expected) {
        compareDataWithExpected(data, expected);
    }
};

export const assertDirectory = (
    data: Record<string, any>,
    expected?: Record<string, any>
) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('id');
    expect(data.id).to.be.a('number');
    expect(data).to.have.property('name');
    expect(data.name).to.be.a('string');
    expect(data).to.have.property('userId');
    expect(data.userId).to.be.a('number');
    if (data.parentId) {
        expect(data.parentId).to.satisfy((id: any) => (
            id === null || typeof id === 'number'
        ));
    }
    if (expected) {
        compareDataWithExpected(data, expected);
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
        compareDataWithExpected(data, expected);
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

export const assertSketchToken = (data: Record<string, any>) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('color');
    expect(data.color).to.be.a('string');
    expect(data).to.have.property('user');
    if (data.user) {
        expect(data.user).to.have.property('id');
        expect(data.user.id).to.be.a('number');
        expect(data.user).to.have.property('name');
        expect(data.user.name).to.be.a('string');
    }
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
    expect(data).to.have.property('tokens');
    expect(data.tokens).to.be.an('array');
    data.tokens.forEach((token: any) => {
        assertSketchToken(token);
    });
    if (expected) {
        expect(data).to.deep.equalInAnyOrder(expected);
    }
};

export const assertSketchObject = (
    data: Record<string, any>,
    expected?: Record<string, any>
) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('id');
    expect(data.id).to.be.a('number');
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

export const assertSession = (
    data: Record<string, any>,
    expected?: Record<string, any>
) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('gameId');
    expect(data.gameId).to.be.a('string');
    expect(data).to.have.property('masterId');
    expect(data.masterId).to.be.a('number');
    assertSketchObject(data, expected);
};

export const assertNote = (
    data: Record<string, any>,
    expected?: Record<string, any>,
    shouldContainUser: boolean | null = null
) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('id');
    expect(data.id).to.be.a('number');
    expect(data).to.have.property('position');
    expect(data.position).to.be.a('number');
    expect(data).to.have.property('isShared');
    expect(data.isShared).to.be.a('boolean');
    expect(data).to.have.property('title');
    expect(data.title).to.be.a('string');
    expect(data).to.have.property('text');
    expect(data.text).to.be.a('string');
    expect(data).to.have.property('sessionId');
    expect(data.sessionId).to.be.a('number');
    expect(data).to.have.property('userId');
    expect(data.userId).to.be.a('number');
    if (shouldContainUser !== null && shouldContainUser) {
        expect(data).to.have.property('user');
        assertUser(data.user);
    } else if (shouldContainUser !== null && !shouldContainUser) {
        expect(data).to.not.have.property('user');
    }
    if (expected) {
        compareDataWithExpected(data, expected);
    }
};

export const assertCharacter = (
    data: Record<string, any>,
    expected?: Record<string, any>
) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('id');
    expect(data.id).to.be.a('number');
    expect(data).to.have.property('userId');
    expect(data.userId).to.be.a('number');
    expect(data).to.have.property('gameId');
    expect(data.gameId).to.be.a('string');
    expect(data).to.have.property('name');
    expect(data.name).to.be.a('string');
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

export const assertError = (data: Record<string, any>) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('error');
    expect(data.error).to.be.a('string');
};
