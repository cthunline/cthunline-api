import TypeDetect from 'type-detect';
import DayJs from 'dayjs';

declare global {
    export namespace Chai {
        interface Assertion {
            dateString(): void;
            arrayOfType(expectedType: string): void;
            status(expectedStatus: number): void;
        }
    }
}

export const ChaiDateString = (chai: Chai.ChaiStatic) => {
    chai.Assertion.addMethod('dateString', function assertDateString() {
        const obj = this._obj; // eslint-disable-line no-underscore-dangle
        this.assert(
            DayJs(obj).isValid(),
            'expected #{this} to be a date-time string',
            'expected #{this} to not be a date-time string',
            obj
        );
    });
};

export const ChaiArrayOfType = (chai: Chai.ChaiStatic) => {
    chai.Assertion.addMethod(
        'arrayOfType',
        function assertArrayOfType(expectedType: string) {
            const obj = this._obj; // eslint-disable-line no-underscore-dangle
            if (!Array.isArray(obj)) {
                throw new Error('arrayOfType can only be used on array values');
            }
            const lowerType = expectedType.toLocaleLowerCase();
            this.assert(
                obj.every(
                    (val) => TypeDetect(val).toLocaleLowerCase() === lowerType
                ),
                `expected #{this} to have every members of type ${expectedType}`,
                `expected #{this} to not have every members of type ${expectedType}`,
                obj
            );
        }
    );
};

export const ChaiHttpStatus = (chai: Chai.ChaiStatic) => {
    chai.Assertion.addMethod(
        'status',
        function assertHttpStatus(expectedStatus: number) {
            const obj = this._obj; // eslint-disable-line no-underscore-dangle
            const hasStatus = Boolean('status' in obj);
            const hasStatusCode = Boolean('statusCode' in obj);
            this.assert(
                hasStatus || hasStatusCode,
                "expected #{act} to have keys 'status', or 'statusCode'",
                '',
                hasStatus || hasStatusCode,
                obj,
                false
            );
            const status = obj.status ?? obj.statusCode;
            this.assert(
                status === expectedStatus,
                'expected #{this} to have status code #{exp} but got #{act}',
                'expected #{this} to not have status code #{act}',
                expectedStatus,
                status
            );
        }
    );
};
