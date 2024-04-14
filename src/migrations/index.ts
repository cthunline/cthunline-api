import { v154 } from './v1.5.4.js';
import { v156 } from './v1.5.6.js';

export const migrateData = async () => {
    await v154();
    await v156();
};
