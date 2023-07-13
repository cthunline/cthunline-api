import 'fastify';

import { SafeUser } from './user';

declare module 'fastify' {
    interface FastifyRequest {
        user: SafeUser;
    }
}
