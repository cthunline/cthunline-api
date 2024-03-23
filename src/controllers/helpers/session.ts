import { Session } from '@prisma/client';

import { prisma } from '../../services/prisma.js';
import { safeUserSelect } from './user.js';

/**
Builds the cache key for play sketch
*/
export const getSketchCacheKey = (sessionId: number) => `sketch-${sessionId}`;

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
    prisma.session.findUniqueOrThrow({
        where: {
            id: sessionId
        }
    });
