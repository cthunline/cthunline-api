import { FastifyInstance } from 'fastify';
import FastifyRateLimit from '@fastify/rate-limit';

import { getEnv } from './env.js';

/**
Register Fastify rate limiter plugin
*/
export const registerRateLimiter = async (app: FastifyInstance) => {
    await app.register(FastifyRateLimit, {
        // window duration in ms
        timeWindow: getEnv('RL_WINDOW_DURATION') * 60 * 1000,
        // limit each IP to N requests per window
        max: getEnv('RL_MAX_REQUESTS')
    });
};
