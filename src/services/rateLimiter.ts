import RateLimit from 'express-rate-limit';

import { env } from './env';

const { RL_WINDOW_DURATION, RL_MAX_REQUESTS } = env;

const rateLimiter = RateLimit({
    // window duration in ms
    windowMs: RL_WINDOW_DURATION * 60 * 1000,
    // limit each IP to N requests per window
    max: RL_MAX_REQUESTS,
    // return rate limit info in the RateLimit-* headers
    standardHeaders: true,
    // disable the X-RateLimit-* headers
    legacyHeaders: false
});

export default rateLimiter;
