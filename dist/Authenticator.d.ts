import { SecureSessionManager } from './session-managers/SecureSessionManager';
import { AnyStrategy, Strategy } from './strategies';
import { FastifyRequest, RouteHandlerMethod, FastifyPlugin } from 'fastify';
import { AuthenticateOptions, AuthenticateCallback } from './AuthenticationRoute';
export declare type SerializeFunction<User = any, SerializedUser = any> = (user: User, req: FastifyRequest) => Promise<SerializedUser>;
export declare type DeserializeFunction<SerializedUser = any, User = any> = (serialized: SerializedUser, req: FastifyRequest) => Promise<User>;
export declare type InfoTransformerFunction = (info: any) => Promise<any>;
export interface AuthenticatorOptions {
    key?: string;
    userProperty?: string;
}
export declare class Authenticator {
    key: string;
    userProperty: string;
    sessionManager: SecureSessionManager;
    private strategies;
    private serializers;
    private deserializers;
    private infoTransformers;
    constructor(options?: AuthenticatorOptions);
    use(strategy: AnyStrategy): this;
    use(name: string, strategy: AnyStrategy): this;
    unuse(name: string): this;
    initialize(): FastifyPlugin;
    authenticate<StrategyOrStrategies extends string | Strategy | (string | Strategy)[]>(strategy: StrategyOrStrategies, callback?: AuthenticateCallback<StrategyOrStrategies>): RouteHandlerMethod;
    authenticate<StrategyOrStrategies extends string | Strategy | (string | Strategy)[]>(strategy: StrategyOrStrategies, options?: AuthenticateOptions): RouteHandlerMethod;
    authenticate<StrategyOrStrategies extends string | Strategy | (string | Strategy)[]>(strategy: StrategyOrStrategies, options?: AuthenticateOptions, callback?: AuthenticateCallback<StrategyOrStrategies>): RouteHandlerMethod;
    authorize<StrategyOrStrategies extends string | Strategy | (string | Strategy)[]>(strategy: StrategyOrStrategies, callback?: AuthenticateCallback<StrategyOrStrategies>): any;
    authorize<StrategyOrStrategies extends string | Strategy | (string | Strategy)[]>(strategy: StrategyOrStrategies, options?: AuthenticateOptions): any;
    authorize<StrategyOrStrategies extends string | Strategy | (string | Strategy)[]>(strategy: StrategyOrStrategies, options?: AuthenticateOptions, callback?: AuthenticateCallback<StrategyOrStrategies>): any;
    secureSession(options?: AuthenticateOptions): FastifyPlugin;
    registerUserSerializer<TUser, TID>(fn: SerializeFunction<TUser, TID>): void;
    serializeUser<User, StoredUser = any>(user: User, request: FastifyRequest): Promise<StoredUser>;
    registerUserDeserializer<User, StoredUser>(fn: DeserializeFunction<User, StoredUser>): void;
    deserializeUser<StoredUser>(stored: StoredUser, request: FastifyRequest): Promise<StoredUser | false>;
    registerAuthInfoTransformer(fn: InfoTransformerFunction): void;
    transformAuthInfo(info: any, request: FastifyRequest): Promise<any>;
    strategy(name: string): AnyStrategy | undefined;
    private runStack;
}
export default Authenticator;
