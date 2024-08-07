import type { UserInsert } from '../../../src/drizzle/schema.js';

export const users: (UserInsert & { id: number })[] = [
    {
        id: 1,
        name: 'Anna Maria Jopek',
        email: 'am.jopek@test.com',
        password:
            '$2b$10$xGldK.NZjcGdnG7zYOuUu.OxSwgPCwB.x2h.vaa2961IH3UJZ1bXm',
        theme: 'dark',
        locale: 'en',
        isAdmin: false,
        isEnabled: true
    },
    {
        id: 2,
        name: 'Delphine Cascarino',
        email: 'd.cascarino@test.com',
        password:
            '$2b$10$xGldK.NZjcGdnG7zYOuUu.OxSwgPCwB.x2h.vaa2961IH3UJZ1bXm',
        theme: 'light',
        locale: 'en',
        isAdmin: false,
        isEnabled: true
    },
    {
        id: 3,
        name: 'Test',
        email: 'admin@test.com',
        password:
            '$2b$10$xGldK.NZjcGdnG7zYOuUu.OxSwgPCwB.x2h.vaa2961IH3UJZ1bXm',
        theme: 'dark',
        locale: 'fr',
        isAdmin: true,
        isEnabled: true
    },
    {
        id: 4,
        name: 'IAmDisabled',
        email: 'disabled@test.com',
        password:
            '$2b$10$xGldK.NZjcGdnG7zYOuUu.OxSwgPCwB.x2h.vaa2961IH3UJZ1bXm',
        theme: 'light',
        locale: 'fr',
        isAdmin: true,
        isEnabled: false
    }
];
