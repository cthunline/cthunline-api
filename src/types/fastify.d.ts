import 'fastify';

import type { SocketIoServer } from './socket.js';
import type { SafeUser } from './user.js';

declare module 'fastify' {
    interface FastifyInstance {
        io: SocketIoServer;
    }
    interface FastifyRequest {
        user: SafeUser;
    }
}
