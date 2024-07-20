import type { SafeUser } from '../../drizzle/schema.js';
import { getEnv } from '../../services/env.js';
import {
    ConflictError,
    ForbiddenError,
    ValidationError
} from '../../services/errors.js';
import { locales } from '../../services/locale.js';
import { getUserByEmail } from '../../services/queries/user.js';

/**
Default optional fields for a new user
*/
export const defaultUserData: Pick<
    SafeUser,
    'theme' | 'locale' | 'isAdmin' | 'isEnabled'
> = {
    theme: getEnv('DEFAULT_THEME'),
    locale: getEnv('DEFAULT_LOCALE'),
    isAdmin: false,
    isEnabled: true
};

/**
Throws forbidden error if any of the admin fields exists in the user edit body.
*/
export const controlAdminFields = <T extends object>(body: T) => {
    const adminFields = ['isAdmin', 'isEnabled'];
    for (const field of adminFields) {
        if (Object.hasOwn(body, field)) {
            throw new ForbiddenError();
        }
    }
};

/**
Checks user email is unique.
*/
export const controlUniqueEmail = async (email: string) => {
    const checkEmail = await getUserByEmail(email);
    if (checkEmail) {
        throw new ConflictError(`Email ${email} already taken`);
    }
};

/**
Checks locale is valid.
*/
export const controlLocale = (locale: string) => {
    if (!locales.includes(locale)) {
        throw new ValidationError(`Invalid locale ${locale}`);
    }
};
