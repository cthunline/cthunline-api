import { User } from '@prisma/client';

export type UserSelect = Omit<User, 'password'>;
