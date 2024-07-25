import { v154 } from './v1.5.4.js';
import { v156 } from './v1.5.6.js';
import { v180 } from './v1.8.0.js';
import { v1100 } from './v1.10.0.js';

export const migrateData = async () => {
    await v154();
    await v156();
    await v180();
    await v1100();
};
