import { Strategy } from './base';
import { DeserializeFunction } from '../Authenticator';
import type { FastifyRequest } from 'fastify';
export declare class SessionStrategy extends Strategy {
    private deserializeUser;
    constructor(deserializeUser: DeserializeFunction);
    constructor(options: any, deserializeUser: DeserializeFunction);
    authenticate(request: FastifyRequest, options?: {
        pauseStream?: boolean;
    }): void;
}
