import { FastifyRequest } from 'fastify';
export declare class Strategy {
    name: string;
    constructor(name: string);
    authenticate(request: FastifyRequest, options?: any): void;
    success: (user: any, info?: any) => void;
    fail: ((challenge?: any, status?: number) => void) | ((status?: number) => void);
    redirect: (url: string, status?: number) => void;
    pass: () => void;
    error: (err: Error) => void;
}
