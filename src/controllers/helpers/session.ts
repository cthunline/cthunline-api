import { Session } from '@prisma/client';

import { Prisma } from '../../services/prisma.js';
import { safeUserSelect } from './user.js';

export const defaultSketchData = {
    displayed: false,
    paths: [],
    images: [],
    tokens: []
};

export const getInclude = (includeMaster: boolean) =>
    includeMaster
        ? {
              include: {
                  master: {
                      select: safeUserSelect
                  }
              }
          }
        : undefined;

export const getSession = async (sessionId: number): Promise<Session> =>
    Prisma.session.findUniqueOrThrow({
        where: {
            id: sessionId
        }
    });
