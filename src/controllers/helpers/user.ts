import { Prisma } from '../../services/prisma';
import {
    ForbiddenError,
    ConflictError,
    ValidationError
} from '../../services/errors';
import { UserSelect } from '../../types/user';
import { env } from '../../services/env';
import { locales } from '../../types/env';

const { DEFAULT_THEME, DEFAULT_LOCALE } = env;

// default optional fields for a new user
export const defaultUserData: Partial<UserSelect> = {
    theme: DEFAULT_THEME,
    locale: DEFAULT_LOCALE,
    isAdmin: false
};

// prisma select object to exclude password in returned data
export const userSelect = {
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
export const getUser = async (userId: number): Promise<UserSelect> => (
    Prisma.user.findUniqueOrThrow({
        select: userSelect,
        where: {
            id: userId
        }
    })
);

// throws forbidden error if any of the admin fields exists in the user edit body
export const controlAdminFields = (body: object) => {
    const adminFields = ['isAdmin', 'isEnabled'];
    for (const field of adminFields) {
        if (Object.hasOwn(body, field)) {
            throw new ForbiddenError();
        }
    }
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
