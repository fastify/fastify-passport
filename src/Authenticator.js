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
exports.Authenticator = void 0;
var fastify_plugin_1 = require("fastify-plugin");
var AuthenticationRoute_1 = require("./AuthenticationRoute");
var CreateInitializePlugin_1 = require("./CreateInitializePlugin");
var SecureSessionManager_1 = require("./session-managers/SecureSessionManager");
var strategies_1 = require("./strategies");
var Authenticator = /** @class */ (function () {
    function Authenticator(options) {
        if (options === void 0) { options = {}; }
        var _a;
        this.strategies = {};
        this.serializers = [];
        this.deserializers = [];
        this.infoTransformers = [];
        this.key = options.key || 'passport';
        this.userProperty = options.userProperty || 'user';
        this.use(new strategies_1.SessionStrategy(this.deserializeUser.bind(this)));
        this.clearSessionOnLogin = (_a = options.clearSessionOnLogin) !== null && _a !== void 0 ? _a : true;
        this.clearSessionIgnoreFields = __spreadArray(['passport', 'session'], (options.clearSessionIgnoreFields || []), true);
        this.sessionManager = new SecureSessionManager_1.SecureSessionManager({
            key: this.key,
            clearSessionOnLogin: this.clearSessionOnLogin,
            clearSessionIgnoreFields: this.clearSessionIgnoreFields
        }, this.serializeUser.bind(this));
    }
    Authenticator.prototype.use = function (name, strategy) {
        if (!strategy) {
            strategy = name;
            name = strategy.name;
        }
        if (!name) {
            throw new Error('Authentication strategies must have a name');
        }
        this.strategies[name] = strategy;
        return this;
    };
    Authenticator.prototype.unuse = function (name) {
        delete this.strategies[name];
        return this;
    };
    Authenticator.prototype.initialize = function () {
        return (0, CreateInitializePlugin_1.CreateInitializePlugin)(this);
    };
    Authenticator.prototype.authenticate = function (strategyOrStrategies, optionsOrCallback, callback) {
        var options;
        if (typeof optionsOrCallback == 'function') {
            options = {};
            callback = optionsOrCallback;
        }
        else {
            options = optionsOrCallback;
        }
        return new AuthenticationRoute_1.AuthenticationRoute(this, strategyOrStrategies, options, callback).handler;
    };
    Authenticator.prototype.authorize = function (strategyOrStrategies, optionsOrCallback, callback) {
        var options;
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
    };
    /**
     * Hook or handler that will restore login state from a session managed by @fastify/secure-session.
     *
     * Web applications typically use sessions to maintain login state between requests.  For example, a user will authenticate by entering credentials into a form which is submitted to the server.  If the credentials are valid, a login session is established by setting a cookie containing a session identifier in the user's web browser.  The web browser will send this cookie in subsequent requests to the server, allowing a session to be maintained.
     *
     * If sessions are being utilized, and a login session has been established, this middleware will populate `request.user` with the current user.
     *
     * Note that sessions are not strictly required for Passport to operate. However, as a general rule, most web applications will make use of sessions. An exception to this rule would be an API server, which expects each HTTP request to provide credentials in an Authorization header.
     *
     * Examples:
     *
     *     server.register(FastifySecureSession);
     *     server.register(FastifyPassport.initialize());
     *     server.register(FastifyPassport.secureSession());
     *
     * Options:
     *   - `pauseStream`      Pause the request stream before deserializing the user
     *                        object from the session.  Defaults to _false_.  Should
     *                        be set to true in cases where middleware consuming the
     *                        request body is configured after passport and the
     *                        deserializeUser method is asynchronous.
     *
     * @return {Function} middleware
     */
    Authenticator.prototype.secureSession = function (options) {
        var _this = this;
        return (0, fastify_plugin_1.default)(function (fastify) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                fastify.addHook('preValidation', new AuthenticationRoute_1.AuthenticationRoute(this, 'session', options).handler);
                return [2 /*return*/];
            });
        }); });
    };
    /**
     * Registers a function used to serialize user objects into the session.
     *
     * Examples:
     *
     *     passport.registerUserSerializer(async (user) => user.id);
     *
     * @api public
     */
    Authenticator.prototype.registerUserSerializer = function (fn) {
        this.serializers.push(fn);
    };
    /** Runs the chain of serializers to find the first one that serializes a user, and returns it. */
    Authenticator.prototype.serializeUser = function (user, request) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runStack(this.serializers, user, request)];
                    case 1:
                        result = _a.sent();
                        if (result) {
                            return [2 /*return*/, result];
                        }
                        else {
                            throw new Error("Failed to serialize user into session. Tried ".concat(this.serializers.length, " serializers."));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Registers a function used to deserialize user objects out of the session.
     *
     * Examples:
     *
     *     fastifyPassport.registerUserDeserializer(async (id) => {
     *       return await User.findById(id);
     *     });
     *
     * @api public
     */
    Authenticator.prototype.registerUserDeserializer = function (fn) {
        this.deserializers.push(fn);
    };
    Authenticator.prototype.deserializeUser = function (stored, request) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runStack(this.deserializers, stored, request)];
                    case 1:
                        result = _a.sent();
                        if (result) {
                            return [2 /*return*/, result];
                        }
                        else if (result === null || result === false) {
                            return [2 /*return*/, false];
                        }
                        else {
                            throw new Error("Failed to deserialize user out of session. Tried ".concat(this.deserializers.length, " serializers."));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Registers a function used to transform auth info.
     *
     * In some circumstances authorization details are contained in authentication credentials or loaded as part of verification.
     *
     * For example, when using bearer tokens for API authentication, the tokens may encode (either directly or indirectly in a database), details such as scope of access or the client to which the token was issued.
     *
     * Such authorization details should be enforced separately from authentication. Because Passport deals only with the latter, this is the responsibility of middleware or routes further along the chain.  However, it is not optimal to decode the same data or execute the same database query later.  To avoid this, Passport accepts optional `info` along with the authenticated `user` in a strategy's `success()` action.  This info is set at `request.authInfo`, where said later middlware or routes can access it.
     *
     * Optionally, applications can register transforms to process this info, which take effect prior to `request.authInfo` being set.  This is useful, forexample, when the info contains a client ID.  The transform can load the client from the database and include the instance in the transformed info, allowing the full set of client properties to be convieniently accessed.
     *
     * If no transforms are registered, `info` supplied by the strategy will be left unmodified.
     *
     * Examples:
     *
     *     fastifyPassport.registerAuthInfoTransformer(async (info) => {
     *       info.client = await Client.findById(info.clientID);
     *       return info;
     *     });
     *
     * @api public
     */
    Authenticator.prototype.registerAuthInfoTransformer = function (fn) {
        this.infoTransformers.push(fn);
    };
    Authenticator.prototype.transformAuthInfo = function (info, request) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runStack(this.infoTransformers, info, request)
                        // if no transformers are registered (or they all pass), the default behavior is to use the un-transformed info as-is
                    ];
                    case 1:
                        result = _a.sent();
                        // if no transformers are registered (or they all pass), the default behavior is to use the un-transformed info as-is
                        return [2 /*return*/, result || info];
                }
            });
        });
    };
    /**
     * Return strategy with given `name`.
     *
     * @param {String} name
     * @return {AnyStrategy}
     * @api private
     */
    Authenticator.prototype.strategy = function (name) {
        return this.strategies[name];
    };
    Authenticator.prototype.runStack = function (stack) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a, stack_1, attempt, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = 0, stack_1 = stack;
                        _b.label = 1;
                    case 1:
                        if (!(_a < stack_1.length)) return [3 /*break*/, 6];
                        attempt = stack_1[_a];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, attempt.apply(void 0, args)];
                    case 3: return [2 /*return*/, _b.sent()];
                    case 4:
                        e_1 = _b.sent();
                        if (e_1 == 'pass') {
                            return [3 /*break*/, 5];
                        }
                        else {
                            throw e_1;
                        }
                        return [3 /*break*/, 5];
                    case 5:
                        _a++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return Authenticator;
}());
exports.Authenticator = Authenticator;
exports.default = Authenticator;
