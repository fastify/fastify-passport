import { FastifyRequest } from 'fastify';
import { SerializeFunction } from '../Authenticator';
export declare class SecureSessionManager {
    key: string;
    serializeUser: SerializeFunction;
    constructor(options: SerializeFunction | any, serializeUser?: SerializeFunction);
    logIn(request: FastifyRequest, user: any): Promise<void>;
    logOut(request: FastifyRequest): Promise<void>;
    getUserFromSession(request: FastifyRequest): any;
}
