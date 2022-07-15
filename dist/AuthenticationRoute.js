"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationRoute = void 0;
const http = require("http");
const errors_1 = require("./errors");
const util_1 = require("util");
const addMessage = (request, message) => {
    const existing = request.session.get('messages');
    const messages = existing ? [...existing, message] : [message];
    request.session.set('messages', messages);
};
const Unhandled = Symbol.for('passport-unhandled');
class AuthenticationRoute {
    constructor(authenticator, strategyOrStrategies, options, callback) {
        this.authenticator = authenticator;
        this.callback = callback;
        this.handler = async (request, reply) => {
            if (!request.passport) {
                throw new Error('passport.initialize() plugin not in use');
            }
            const failures = [];
            for (const nameOrInstance of this.strategies) {
                try {
                    return await this.attemptStrategy(failures, this.getStrategyName(nameOrInstance), this.getStrategy(nameOrInstance), request, reply);
                }
                catch (e) {
                    if (e == Unhandled) {
                        continue;
                    }
                    else {
                        throw e;
                    }
                }
            }
            return this.onAllFailed(failures, request, reply);
        };
        this.options = options || {};
        if (Array.isArray(strategyOrStrategies)) {
            this.strategies = strategyOrStrategies;
            this.isMultiStrategy = false;
        }
        else {
            this.strategies = [strategyOrStrategies];
            this.isMultiStrategy = false;
        }
    }
    attemptStrategy(failures, name, prototype, request, reply) {
        const strategy = Object.create(prototype);
        return new Promise((resolve, reject) => {
            strategy.success = (user, info) => {
                request.log.debug({ strategy: name }, 'passport strategy success');
                if (this.callback) {
                    return resolve(this.callback(request, reply, null, user, info));
                }
                info = info || {};
                this.applyFlashOrMessage('success', request, info);
                if (this.options.assignProperty) {
                    request[this.options.assignProperty] = user;
                    return resolve();
                }
                void request
                    .logIn(user, this.options)
                    .catch(reject)
                    .then(() => {
                    const complete = () => {
                        if (this.options.successReturnToOrRedirect) {
                            let url = this.options.successReturnToOrRedirect;
                            if (request.session && request.session.get('returnTo')) {
                                url = request.session.get('returnTo');
                                request.session.set('returnTo', undefined);
                            }
                            void reply.redirect(url);
                        }
                        else if (this.options.successRedirect) {
                            void reply.redirect(this.options.successRedirect);
                        }
                        return resolve();
                    };
                    if (this.options.authInfo !== false) {
                        void this.authenticator
                            .transformAuthInfo(info, request)
                            .catch(reject)
                            .then((transformedInfo) => {
                            request.authInfo = transformedInfo;
                            complete();
                        });
                    }
                    else {
                        complete();
                    }
                });
            };
            strategy.fail = function (challengeOrStatus, status) {
                request.log.trace({ strategy: name }, 'passport strategy failed');
                let challenge;
                if (typeof challengeOrStatus === 'number') {
                    status = challengeOrStatus;
                    challenge = undefined;
                }
                else {
                    challenge = challengeOrStatus;
                }
                failures.push({ challenge, status: status });
                reject(Unhandled);
            };
            strategy.redirect = (url, status) => {
                request.log.trace({ strategy: name, url }, 'passport strategy redirecting');
                void reply.status(status || 302);
                void reply.redirect(url);
                resolve();
            };
            strategy.pass = () => {
                request.log.trace({ strategy: name }, 'passport strategy passed');
                resolve();
            };
            const error = (err) => {
                request.log.trace({ strategy: name, err }, 'passport strategy errored');
                if (this.callback) {
                    return resolve(this.callback(request, reply, err));
                }
                reject(err);
            };
            strategy.error = error;
            request.log.trace({ strategy: name }, 'attempting passport strategy authentication');
            try {
                const result = strategy.authenticate(request, this.options);
                if (util_1.types.isPromise(result)) {
                    void result.catch(error);
                }
            }
            catch (err) {
                error(err);
            }
        });
    }
    async onAllFailed(failures, request, reply) {
        var _a;
        request.log.trace('all passport strategies failed');
        if (this.callback) {
            if (this.isMultiStrategy) {
                const challenges = failures.map((f) => f.challenge);
                const statuses = failures.map((f) => f.status);
                return await this.callback(request, reply, null, false, challenges, statuses);
            }
            else {
                return await this.callback(request, reply, null, false, failures[0].challenge, failures[0].status);
            }
        }
        this.applyFlashOrMessage('failure', request, this.toFlashObject((_a = failures[0]) === null || _a === void 0 ? void 0 : _a.challenge, 'error'));
        if (this.options.failureRedirect) {
            return reply.redirect(this.options.failureRedirect);
        }
        const rchallenge = [];
        let rstatus;
        for (const failure of failures) {
            rstatus = rstatus || failure.status;
            if (typeof failure.challenge === 'string') {
                rchallenge.push(failure.challenge);
            }
        }
        rstatus = rstatus || 401;
        void reply.code(rstatus);
        if (reply.statusCode === 401 && rchallenge.length) {
            void reply.header('WWW-Authenticate', rchallenge);
        }
        if (this.options.failWithError) {
            throw new errors_1.default(http.STATUS_CODES[reply.statusCode], rstatus);
        }
        void reply.send(http.STATUS_CODES[reply.statusCode]);
    }
    applyFlashOrMessage(event, request, result) {
        var _a;
        const flashOption = this.options[`${event}Flash`];
        const level = event == 'success' ? 'success' : 'error';
        if (flashOption) {
            let flash;
            if (typeof flashOption === 'boolean') {
                flash = this.toFlashObject(result, level);
            }
            else {
                flash = this.toFlashObject(flashOption, level);
            }
            if (flash && flash.type && flash.message) {
                request.flash(flash.type, flash.message);
            }
        }
        const messageOption = this.options[`${event}Message`];
        if (messageOption) {
            const message = typeof messageOption === 'boolean' ? (_a = this.toFlashObject(result, level)) === null || _a === void 0 ? void 0 : _a.message : messageOption;
            if (message) {
                addMessage(request, message);
            }
        }
    }
    toFlashObject(input, type) {
        if (typeof input == 'undefined') {
            return;
        }
        else if (typeof input == 'string') {
            return { type, message: input };
        }
        else {
            return input;
        }
    }
    getStrategyName(nameOrInstance) {
        if (typeof nameOrInstance === 'string') {
            return nameOrInstance;
        }
        else if (nameOrInstance.name) {
            return nameOrInstance.name;
        }
        else {
            return nameOrInstance.constructor.name;
        }
    }
    getStrategy(nameOrInstance) {
        if (typeof nameOrInstance === 'string') {
            const prototype = this.authenticator.strategy(nameOrInstance);
            if (!prototype) {
                throw new Error(`Unknown authentication strategy ${nameOrInstance}, no strategy with this name has been registered.`);
            }
            return prototype;
        }
        else {
            return nameOrInstance;
        }
    }
}
exports.AuthenticationRoute = AuthenticationRoute;
