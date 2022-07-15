import { flashFactory } from '@fastify/flash/lib/flash';
import { logIn, logOut, isAuthenticated, isUnauthenticated } from './decorators';
import Authenticator from './Authenticator';
declare module 'fastify' {
    interface PassportUser {
    }
    interface FastifyRequest {
        flash: ReturnType<typeof flashFactory>['request'];
        login: typeof logIn;
        logIn: typeof logIn;
        logout: typeof logOut;
        logOut: typeof logOut;
        isAuthenticated: typeof isAuthenticated;
        isUnauthenticated: typeof isUnauthenticated;
        passport: Authenticator;
        user?: PassportUser;
        authInfo?: Record<string, any>;
        account?: PassportUser;
    }
    interface FastifyReply {
        flash: ReturnType<typeof flashFactory>['reply'];
    }
}
