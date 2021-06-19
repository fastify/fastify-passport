import Authenticator from './Authenticator';
import { AnyStrategy, Strategy } from './strategies';
import { FastifyReply, FastifyRequest } from 'fastify';
declare type FlashObject = {
    type?: string;
    message?: string;
};
declare type FailureObject = {
    challenge?: string | FlashObject;
    status?: number;
    type?: string;
};
export interface AuthenticateOptions {
    scope?: string | string[];
    failureFlash?: boolean | string | FlashObject;
    failureMessage?: boolean | string;
    successRedirect?: string;
    failureRedirect?: string;
    failWithError?: boolean;
    successFlash?: boolean | string | FlashObject;
    successMessage?: boolean | string;
    assignProperty?: string;
    successReturnToOrRedirect?: string;
    authInfo?: boolean;
    session?: boolean;
}
export declare type SingleStrategyCallback = (request: FastifyRequest, reply: FastifyReply, err: null | Error, user?: unknown, info?: unknown, status?: number) => Promise<void>;
export declare type MultiStrategyCallback = (request: FastifyRequest, reply: FastifyReply, err: null | Error, user?: unknown, info?: unknown, statuses?: (number | undefined)[]) => Promise<void>;
export declare type AuthenticateCallback<StrategyOrStrategies extends string | Strategy | (string | Strategy)[]> = StrategyOrStrategies extends any[] ? MultiStrategyCallback : SingleStrategyCallback;
export declare class AuthenticationRoute<StrategyOrStrategies extends string | Strategy | (string | Strategy)[]> {
    readonly authenticator: Authenticator;
    readonly callback?: AuthenticateCallback<StrategyOrStrategies> | undefined;
    readonly options: AuthenticateOptions;
    readonly strategies: (string | Strategy)[];
    readonly isMultiStrategy: boolean;
    constructor(authenticator: Authenticator, strategyOrStrategies: StrategyOrStrategies, options?: AuthenticateOptions, callback?: AuthenticateCallback<StrategyOrStrategies> | undefined);
    handler: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    attemptStrategy(failures: FailureObject[], name: string, prototype: AnyStrategy, request: FastifyRequest, reply: FastifyReply): Promise<void>;
    onAllFailed(failures: FailureObject[], request: FastifyRequest, reply: FastifyReply): Promise<void>;
    applyFlashOrMessage(event: 'success' | 'failure', request: FastifyRequest, result?: FlashObject): void;
    toFlashObject(input: string | FlashObject | undefined, type: string): FlashObject | undefined;
    private getStrategyName;
    private getStrategy;
}
export {};
