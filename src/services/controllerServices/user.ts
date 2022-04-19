import {
    Prisma,
    handleNotFound
} from '../prisma';
import { ForbiddenError, ConflictError } from '../errors';
import { UserSelect } from '../../types/user';

// prisma select object to exclude password in returned data
export const userSelect = {
    id: true,
    name: true,
    email: true,
    isAdmin: true,
    isEnabled: true,
    createdAt: true,
    updatedAt: true
};

// check a user exists and return it
// returned user data will not contain password
export const getUser = async (userId: string): Promise<UserSelect> => (
    handleNotFound<UserSelect>(
        'User', (
            Prisma.user.findUnique({
                select: userSelect,
                where: {
                    id: userId
                }
            })
        )
    )
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
