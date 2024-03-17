import { Prisma } from '../../services/prisma.js';
import {
    ForbiddenError,
    ConflictError,
    ValidationError
} from '../../services/errors.js';
import { SafeUser } from '../../types/user.js';
import { getEnv } from '../../services/env.js';
import { locales } from '../../services/locale.js';

// default optional fields for a new user
export const defaultUserData: Pick<SafeUser, 'theme' | 'locale' | 'isAdmin'> = {
    theme: getEnv('DEFAULT_THEME'),
    locale: getEnv('DEFAULT_LOCALE'),
    isAdmin: false
};

// prisma select object to exclude password in returned data
export const safeUserSelect = {
    id: true,
    name: true,
    email: true,
    theme: true,
    locale: true,
    isAdmin: true,
    isEnabled: true,
    createdAt: true,
    updatedAt: true
};

// check a user exists and return it
// returned user data will not contain password
export const getUser = async (userId: number): Promise<SafeUser> =>
    Prisma.user.findUniqueOrThrow({
        select: safeUserSelect,
        where: {
            id: userId
        }
    });

// throws forbidden error if any of the admin fields exists in the user edit body
export const controlAdminFields = <T extends object>(body: T) => {
    const adminFields = ['isAdmin', 'isEnabled'];
    adminFields.forEach((field) => {
        if (Object.hasOwn(body, field)) {
            throw new ForbiddenError();
        }
    });
};

// check user email is unique
export const controlUniqueEmail = async (email: string) => {
    const checkEmail = await Prisma.user.findUnique({
        where: {
            email
        }
    });
    if (checkEmail) {
        throw new ConflictError(`Email ${email} already taken`);
    }
};

// check locale is valid
export const controlLocale = (locale: string) => {
    if (!locales.includes(locale)) {
        throw new ValidationError(`Invalid locale ${locale}`);
    }
};
