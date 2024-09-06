"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationRoute = void 0;
/// <reference types="@fastify/secure-session" />
var http = require("http");
var errors_1 = require("./errors");
var util_1 = require("util");
var addMessage = function (request, message) {
    var existing = request.session.get('messages');
    var messages = existing ? __spreadArray(__spreadArray([], existing, true), [message], false) : [message];
    request.session.set('messages', messages);
};
var Unhandled = Symbol.for('passport-unhandled');
var AuthenticationRoute = /** @class */ (function () {
    /**
     * Create a new route handler that runs authentication strategies.
     *
     * @param authenticator aggregator instance that owns the chain of strategies
     * @param strategyOrStrategies list of strategies this handler tries as string names of registered strategies or strategy instances
     * @param options  options governing behaviour of strategies
     * @param callback optional custom callback to process the result of the strategy invocations
     */
    function AuthenticationRoute(authenticator, strategyOrStrategies, options, callback) {
        var _this = this;
        this.authenticator = authenticator;
        this.callback = callback;
        this.handler = function (request, reply) { return __awaiter(_this, void 0, void 0, function () {
            var failures, _i, _a, nameOrInstance, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!request.passport) {
                            throw new Error('passport.initialize() plugin not in use');
                        }
                        failures = [];
                        _i = 0, _a = this.strategies;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        nameOrInstance = _a[_i];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.attemptStrategy(failures, this.getStrategyName(nameOrInstance), this.getStrategy(nameOrInstance), request, reply)];
                    case 3: return [2 /*return*/, _b.sent()];
                    case 4:
                        e_1 = _b.sent();
                        if (e_1 == Unhandled) {
                            return [3 /*break*/, 5];
                        }
                        else {
                            throw e_1;
                        }
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, this.onAllFailed(failures, request, reply)];
                }
            });
        }); };
        this.options = options || {};
        // Cast `name` to an array, allowing authentication to pass through a chain of strategies.  The first strategy to succeed, redirect, or error will halt the chain.  Authentication failures will proceed through each strategy in series, ultimately failing if all strategies fail.
        // This is typically used on API endpoints to allow clients to authenticate using their preferred choice of Basic, Digest, token-based schemes, etc. It is not feasible to construct a chain of multiple strategies that involve redirection (for example both Facebook and Twitter), since the first one to redirect will halt the chain.
        if (Array.isArray(strategyOrStrategies)) {
            this.strategies = strategyOrStrategies;
            this.isMultiStrategy = false;
        }
        else {
            this.strategies = [strategyOrStrategies];
            this.isMultiStrategy = false;
        }
    }
    AuthenticationRoute.prototype.attemptStrategy = function (failures, name, prototype, request, reply) {
        var _this = this;
        var strategy = Object.create(prototype);
        // This is a messed up way of adapting passport's API to fastify's async world. We create a promise that the strategy's per-call functions close over and resolve/reject with the result of the strategy. This augmentation business is a key part of how Passport strategies expect to work.
        return new Promise(function (resolve, reject) {
            /**
             * Authenticate `user`, with optional `info`.
             *
             * Strategies should call this function to successfully authenticate a user.  `user` should be an object supplied by the application after it has been given an opportunity to verify credentials.  `info` is an optional argument containing additional user information.  This is useful for third-party authentication strategies to pass profile details.
             */
            strategy.success = function (user, info) {
                request.log.debug({ strategy: name }, 'passport strategy success');
                if (_this.callback) {
                    return resolve(_this.callback(request, reply, null, user, info));
                }
                info = info || {};
                _this.applyFlashOrMessage('success', request, info);
                if (_this.options.assignProperty) {
                    request[_this.options.assignProperty] = user;
                    return resolve();
                }
                void request
                    .logIn(user, _this.options)
                    .catch(reject)
                    .then(function () {
                    var complete = function () {
                        var _a;
                        if (_this.options.successReturnToOrRedirect) {
                            var url = _this.options.successReturnToOrRedirect;
                            var returnTo = (_a = request.session) === null || _a === void 0 ? void 0 : _a.get('returnTo');
                            if (typeof returnTo === 'string') {
                                url = returnTo;
                                request.session.set('returnTo', undefined);
                            }
                            void reply.redirect(url);
                        }
                        else if (_this.options.successRedirect) {
                            void reply.redirect(_this.options.successRedirect);
                        }
                        return resolve();
                    };
                    if (_this.options.authInfo !== false) {
                        void _this.authenticator
                            .transformAuthInfo(info, request)
                            .catch(reject)
                            .then(function (transformedInfo) {
                            request.authInfo = transformedInfo;
                            complete();
                        });
                    }
                    else {
                        complete();
                    }
                });
            };
            /**
             * Fail authentication, with optional `challenge` and `status`, defaulting to 401.
             *
             * Strategies should call this function to fail an authentication attempt.
             */
            strategy.fail = function (challengeOrStatus, status) {
                request.log.trace({ strategy: name }, 'passport strategy failed');
                var challenge;
                if (typeof challengeOrStatus === 'number') {
                    status = challengeOrStatus;
                    challenge = undefined;
                }
                else {
                    challenge = challengeOrStatus;
                }
                // push this failure into the accumulator and attempt authentication using the next strategy
                failures.push({ challenge: challenge, status: status });
                reject(Unhandled);
            };
            /**
             * Redirect to `url` with optional `status`, defaulting to 302.
             *
             * Strategies should call this function to redirect the user (via their user agent) to a third-party website for authentication.
             */
            strategy.redirect = function (url, status) {
                request.log.trace({ strategy: name, url: url }, 'passport strategy redirecting');
                void reply.status(status || 302);
                void reply.redirect(url);
                resolve();
            };
            /**
             * Pass without making a success or fail decision.
             *
             * Under most circumstances, Strategies should not need to call this function.  It exists primarily to allow previous authentication state to be restored, for example from an HTTP session.
             */
            strategy.pass = function () {
                request.log.trace({ strategy: name }, 'passport strategy passed');
                resolve();
            };
            var error = function (err) {
                request.log.trace({ strategy: name, err: err }, 'passport strategy errored');
                if (_this.callback) {
                    return resolve(_this.callback(request, reply, err));
                }
                reject(err);
            };
            /**
             * Internal error while performing authentication.
             *
             * Strategies should call this function when an internal error occurs during the process of performing authentication; for example, if the user directory is not available.
             */
            strategy.error = error;
            request.log.trace({ strategy: name }, 'attempting passport strategy authentication');
            try {
                var result = strategy.authenticate(request, _this.options);
                if (util_1.types.isPromise(result)) {
                    void result.catch(error);
                }
            }
            catch (err) {
                error(err);
            }
        });
    };
    AuthenticationRoute.prototype.onAllFailed = function (failures, request, reply) {
        return __awaiter(this, void 0, void 0, function () {
            var challenges, statuses, rchallenge, rstatus, _i, failures_1, failure;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        request.log.trace('all passport strategies failed');
                        if (!this.callback) return [3 /*break*/, 4];
                        if (!this.isMultiStrategy) return [3 /*break*/, 2];
                        challenges = failures.map(function (f) { return f.challenge; });
                        statuses = failures.map(function (f) { return f.status; });
                        return [4 /*yield*/, this.callback(request, reply, null, false, challenges, statuses)];
                    case 1: return [2 /*return*/, _b.sent()];
                    case 2: return [4 /*yield*/, this.callback(request, reply, null, false, failures[0].challenge, failures[0].status)];
                    case 3: return [2 /*return*/, _b.sent()];
                    case 4:
                        // Strategies are ordered by priority.  For the purpose of flashing a message, the first failure will be displayed.
                        this.applyFlashOrMessage('failure', request, this.toFlashObject((_a = failures[0]) === null || _a === void 0 ? void 0 : _a.challenge, 'error'));
                        if (this.options.failureRedirect) {
                            return [2 /*return*/, reply.redirect(this.options.failureRedirect)];
                        }
                        rchallenge = [];
                        for (_i = 0, failures_1 = failures; _i < failures_1.length; _i++) {
                            failure = failures_1[_i];
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
                        return [2 /*return*/];
                }
            });
        });
    };
    AuthenticationRoute.prototype.applyFlashOrMessage = function (event, request, result) {
        var _a;
        var flashOption = this.options["".concat(event, "Flash")];
        var level = event == 'success' ? 'success' : 'error';
        if (flashOption) {
            var flash = void 0;
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
        var messageOption = this.options["".concat(event, "Message")];
        if (messageOption) {
            var message = typeof messageOption === 'boolean' ? (_a = this.toFlashObject(result, level)) === null || _a === void 0 ? void 0 : _a.message : messageOption;
            if (message) {
                addMessage(request, message);
            }
        }
    };
    AuthenticationRoute.prototype.toFlashObject = function (input, type) {
        if (input === undefined) {
            return;
        }
        else if (typeof input == 'string') {
            return { type: type, message: input };
        }
        else {
            return input;
        }
    };
    AuthenticationRoute.prototype.getStrategyName = function (nameOrInstance) {
        if (typeof nameOrInstance === 'string') {
            return nameOrInstance;
        }
        else if (nameOrInstance.name) {
            return nameOrInstance.name;
        }
        else {
            return nameOrInstance.constructor.name;
        }
    };
    AuthenticationRoute.prototype.getStrategy = function (nameOrInstance) {
        if (typeof nameOrInstance === 'string') {
            var prototype = this.authenticator.strategy(nameOrInstance);
            if (!prototype) {
                throw new Error("Unknown authentication strategy ".concat(nameOrInstance, ", no strategy with this name has been registered."));
            }
            return prototype;
        }
        else {
            return nameOrInstance;
        }
    };
    return AuthenticationRoute;
}());
exports.AuthenticationRoute = AuthenticationRoute;
