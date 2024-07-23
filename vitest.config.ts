import { defineConfig } from 'vitest/config';

// biome-ignore lint/style/noDefaultExport: required by vite configuration
export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        setupFiles: ['tests/setup.ts'],
        reporters: ['default'],
        maxConcurrency: 1,
        sequence: {
            hooks: 'list'
        },
        poolOptions: {
            forks: {
                singleFork: true
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
