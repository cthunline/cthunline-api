import detectType from 'type-detect';
import { expect } from 'vitest';
import dayjs from 'dayjs';

expect.extend({
    toBeDateString(received) {
        const { isNot } = this;
        return {
            pass: dayjs(received).isValid(),
            message: () =>
                `expected ${received} to${isNot ? ' not' : ''} be a date string`
        };
    },
    toBeArrayOf(received, expectedType: string) {
        const { isNot } = this;
        if (!Array.isArray(received)) {
            throw new Error('toBeArrayOf can only be used on array values');
        }
        const lowerType = expectedType.toLocaleLowerCase();
        return {
            pass: detectType(received).toLocaleLowerCase() === lowerType,
            message: () =>
                `expected ${JSON.stringify(received)} to${isNot ? ' not' : ''} have all members of type ${expectedType}`
        };
    },
    toHaveStatus(received, expectedStatus: number) {
        const { isNot } = this;
        const hasStatus = Boolean('status' in received);
        const hasStatusCode = Boolean('statusCode' in received);
        if (!hasStatus && !hasStatusCode) {
            throw new Error(
                `expected ${received} to have property 'status' or 'statusCode'`
            );
        }
        const status = received.status ?? received.statusCode;
        return {
            pass: status === expectedStatus,
            message: () =>
                `expected response to${isNot ? ' not' : ''} have status ${expectedStatus} but got ${status}`
        };
    }
});
