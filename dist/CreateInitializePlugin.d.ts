/// <reference types="node" />
import Authenticator from './Authenticator';
export declare function CreateInitializePlugin(passport: Authenticator): import("fastify").FastifyPluginAsync<unknown, import("http").Server>;
