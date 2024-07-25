import { expect } from 'vitest';

import type { AppErrorConstructor } from '../../../src/services/errors.js';
import { locales } from '../../../src/services/locale.js';

export const expectAsync = async (
    promise: Promise<any>,
    ErrorClassThatShouldBeThrown?: AppErrorConstructor
) => {
    let error = null;
    try {
        await promise;
    } catch (err: any) {
        error = err;
    }
    if (ErrorClassThatShouldBeThrown) {
        expect(error).to.be.an.instanceOf(ErrorClassThatShouldBeThrown);
    } else {
        expect(error).toBeNull();
    }
};

export const compareDataWithExpected = (
    data: Record<string, any>,
    expected: Record<string, any>
) => {
    for (const key of Object.keys(expected)) {
        expect(data).to.have.property(key);
        expect(data[key]).to.equal(expected[key]);
    }
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
        const { password, oldPassword, ...expectedWithoutPassword } = expected;
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
        expect(data.directoryId).to.satisfy(
            (id: any) => id === null || typeof id === 'number'
        );
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
        expect(data.parentId).to.satisfy(
            (id: any) => id === null || typeof id === 'number'
        );
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

export const assertSketchDrawingPath = (data: Record<string, any>) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('d');
    expect(data.d).to.be.a('string');
    expect(data).to.have.property('color');
    expect(data.color).to.be.a('string');
};

export const assertSketchImage = (data: Record<string, any>) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('id');
    expect(data.id).to.be.a('string');
    expect(data).to.have.property('index');
    expect(data.index).to.be.a('number');
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

export const assertSketchText = (data: Record<string, any>) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('id');
    expect(data.id).to.be.a('string');
    expect(data).to.have.property('index');
    expect(data.index).to.be.a('number');
    expect(data).to.have.property('text');
    expect(data.text).to.be.a('string');
    expect(data).to.have.property('fontSize');
    expect(data.fontSize).to.be.a('number');
    expect(data).to.have.property('color');
    expect(data.color).to.be.a('string');
    expect(data).to.have.property('x');
    expect(data.x).to.be.a('number');
    expect(data).to.have.property('y');
    expect(data.y).to.be.a('number');
};

export const assertSketchToken = (data: Record<string, any>) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('id');
    expect(data.id).to.be.a('string');
    expect(data).to.have.property('index');
    expect(data.index).to.be.a('number');
    expect(data).to.have.property('color');
    expect(data.color).to.be.a('string');
    expect(data).to.have.property('attachedData');
    if (data.attachedData) {
        expect(data.attachedData).to.have.property('userId');
        expect(data.attachedData.userId).to.be.a('number');
        expect(data.attachedData).to.have.property('userName');
        expect(data.attachedData.userName).to.be.a('string');
        expect(data.attachedData).to.have.property('characterId');
        expect(data.attachedData.characterId).to.be.a('number');
        expect(data.attachedData).to.have.property('characterName');
        expect(data.attachedData.characterName).to.be.a('string');
    }
    expect(data).to.have.property('x');
    expect(data.x).to.be.a('number');
    expect(data).to.have.property('y');
    expect(data.y).to.be.a('number');
};

export const assertSketchData = (
    data: Record<string, any>,
    expected?: Record<string, any>
) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('displayed');
    expect(data.displayed).to.be.a('boolean');
    expect(data).to.have.property('paths');
    for (const path of data.paths) {
        assertSketchDrawingPath(path);
    }
    expect(data.paths).to.be.an('array');
    expect(data).to.have.property('images');
    expect(data.images).to.be.an('array');
    for (const image of data.images) {
        assertSketchImage(image);
    }
    expect(data).to.have.property('tokens');
    expect(data.tokens).to.be.an('array');
    for (const token of data.tokens) {
        assertSketchToken(token);
    }
    expect(data).to.have.property('texts');
    expect(data.texts).to.be.an('array');
    for (const text of data.texts) {
        assertSketchText(text);
    }
    if (expected) {
        expect(data).toEqual(expected);
    }
};

export const assertSketch = (
    data: Record<string, any>,
    expected?: Record<string, any>
) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('id');
    expect(data.id).to.be.a('number');
    expect(data).to.have.property('name');
    expect(data.name).to.be.a('string');
    expect(data).to.have.property('data');
    expect(data.data).to.be.an('object');
    if (expected) {
        for (const key of Object.keys(expected)) {
            if (key !== 'data') {
                expect(data).to.have.property(key);
                expect(data[key]).to.equal(expected[key]);
            }
        }
    }
    assertSketchData(data.data, expected?.data);
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
    assertSketchData(data.sketch, expected?.sketch);
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
        assertUser(data.user, expected?.user);
    } else if (shouldContainUser !== null && !shouldContainUser) {
        expect(data).to.not.have.property('user');
    }
    if (expected) {
        const { user: dtUsr, ...compareData } = data;
        const { user: exUsr, ...compareExpected } = expected;
        compareDataWithExpected(compareData, compareExpected);
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
    expect(data).to.have.property('portrait');
    if (data.portrait) {
        expect(data.portrait).to.be.a('string');
    } else {
        expect(data.portrait).toBeNull();
    }
    if (expected) {
        for (const key of Object.keys(expected)) {
            if (key === 'data') {
                expect(data[key]).toEqual(expected[key]);
            } else {
                expect(data).to.have.property(key);
                expect(data[key]).to.equal(expected[key]);
            }
        }
    }
};

export const assertError = (data: Record<string, any>) => {
    expect(data).to.be.an('object');
    expect(data).to.have.property('error');
    expect(data.error).to.be.a('string');
};

export const assertSocketMeta = (data: Record<string, any>) => {
    expect(data).to.have.property('dateTime');
    expect(data.dateTime).toBeDateString();
};
