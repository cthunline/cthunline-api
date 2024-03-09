import 'fastify';

import { type SocketIoServer } from './socket';
import { type SafeUser } from './user';

declare module 'fastify' {
    interface FastifyInstance {
        io: SocketIoServer;
    }
    interface FastifyRequest {
        user: SafeUser;
    }
}
