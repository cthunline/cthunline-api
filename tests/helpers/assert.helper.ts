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
    expect(data).to.not.have.property('password');
    if (expected) {
        const expectedWithoutPassword = { ...expected };
        delete expectedWithoutPassword.password;
        Object.keys(expectedWithoutPassword).forEach((key) => {
            expect(data).to.have.property(key);
            expect(data[key]).to.equal(expected[key]);
        });
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
            if (key === 'sketch') {
                expect(data[key]).to.deep.equalInAnyOrder(expected[key]);
            } else {
                expect(data).to.have.property(key);
                expect(data[key]).to.equal(expected[key]);
            }
        });
    }
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
