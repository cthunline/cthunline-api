import 'vitest';

interface CustomMatchers<R = unknown> {
    toBeDateString: () => R;
    toBeArrayOf: (expectedType: string) => R;
    toHaveStatus: (expectedStatus: number) => R;
}

declare module 'vitest' {
    interface Assertion<T = any> extends CustomMatchers<T> {}
    interface AsymmetricMatchersContaining extends CustomMatchers {}
}
