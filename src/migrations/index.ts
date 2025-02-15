import { v1100 } from './v1.10.0.js';
import { v1130 } from './v1.13.0.js';
import { v1230 } from './v1.23.0.js';

export const migrateData = async () => {
    await v1100();
    await v1130();
    await v1230();
};
