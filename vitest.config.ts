import { defineConfig } from 'vitest/config';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        setupFiles: ['tests/setup.ts'],
        reporters: ['default'],
        maxConcurrency: 1,
        poolOptions: {
            threads: {
                singleThread: true
            }
        },
        coverage: {
            enabled: true,
            provider: 'istanbul',
            reporter: ['text', 'lcov'],
            extension: '.ts',
            all: true,
            reportOnFailure: true
        }
    }
});
