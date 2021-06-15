"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authenticator = void 0;
const SecureSessionManager_1 = require("./session-managers/SecureSessionManager");
const strategies_1 = require("./strategies");
const AuthenticationRoute_1 = require("./AuthenticationRoute");
const CreateInitializePlugin_1 = require("./CreateInitializePlugin");
const fastify_plugin_1 = require("fastify-plugin");
class Authenticator {
    constructor(options = {}) {
        this.strategies = {};
        this.serializers = [];
        this.deserializers = [];
        this.infoTransformers = [];
        this.key = options.key || 'passport';
        this.userProperty = options.userProperty || 'user';
        this.use(new strategies_1.SessionStrategy(this.deserializeUser.bind(this)));
        this.sessionManager = new SecureSessionManager_1.SecureSessionManager({ key: this.key }, this.serializeUser.bind(this));
    }
    use(name, strategy) {
        if (!strategy) {
            strategy = name;
            name = strategy.name;
        }
        if (!name) {
            throw new Error('Authentication strategies must have a name');
        }
        this.strategies[name] = strategy;
        return this;
    }
    unuse(name) {
        delete this.strategies[name];
        return this;
    }
    initialize() {
        return CreateInitializePlugin_1.CreateInitializePlugin(this);
    }
    authenticate(strategyOrStrategies, optionsOrCallback, callback) {
        let options;
        if (typeof optionsOrCallback == 'function') {
            options = {};
            callback = optionsOrCallback;
        }
        else {
            options = optionsOrCallback;
        }
        return new AuthenticationRoute_1.AuthenticationRoute(this, strategyOrStrategies, options, callback).handler;
    }
    authorize(strategyOrStrategies, optionsOrCallback, callback) {
        let options;
        if (typeof optionsOrCallback == 'function') {
            options = {};
            callback = optionsOrCallback;
        }
        else {
            options = optionsOrCallback;
        }
        options || (options = {});
        options.assignProperty = 'account';
        return new AuthenticationRoute_1.AuthenticationRoute(this, strategyOrStrategies, options, callback).handler;
    }
    secureSession(options) {
        return fastify_plugin_1.default(async (fastify) => {
            fastify.addHook('preValidation', new AuthenticationRoute_1.AuthenticationRoute(this, 'session', options).handler);
        });
    }
    registerUserSerializer(fn) {
        this.serializers.push(fn);
    }
    async serializeUser(user, request) {
        const result = await this.runStack(this.serializers, user, request);
        if (result) {
            return result;
        }
        else {
            throw new Error(`Failed to serialize user into session. Tried ${this.serializers.length} serializers.`);
        }
    }
    registerUserDeserializer(fn) {
        this.deserializers.push(fn);
    }
    async deserializeUser(stored, request) {
        const result = await this.runStack(this.deserializers, stored, request);
        if (result) {
            return result;
        }
        else if (result === null || result === false) {
            return false;
        }
        else {
            throw new Error(`Failed to deserialize user out of session. Tried ${this.deserializers.length} serializers.`);
        }
    }
    registerAuthInfoTransformer(fn) {
        this.infoTransformers.push(fn);
    }
    async transformAuthInfo(info, request) {
        const result = await this.runStack(this.infoTransformers, info, request);
        return result || info;
    }
    strategy(name) {
        return this.strategies[name];
    }
    async runStack(stack, ...args) {
        for (const attempt of stack) {
            try {
                return await attempt(...args);
            }
            catch (e) {
                if (e == 'pass') {
                    continue;
                }
                else {
                    throw e;
                }
            }
        }
    }
}
exports.Authenticator = Authenticator;
exports.default = Authenticator;
