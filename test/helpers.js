"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfiguredTestServer = exports.getRegisteredTestServer = exports.getTestServer = exports.TestBrowserSession = exports.TestDatabaseStrategy = exports.TestStrategy = exports.generateTestUser = void 0;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var fastify_1 = require("fastify");
var secure_session_1 = require("@fastify/secure-session");
var cookie_1 = require("@fastify/cookie");
var Authenticator_1 = require("../src/Authenticator");
var strategies_1 = require("../src/strategies");
var set_cookie_parser_1 = require("set-cookie-parser");
var session_1 = require("@fastify/session");
var SecretKey = node_fs_1.default.readFileSync((0, node_path_1.join)(__dirname, '../../test', 'secure.key'));
var counter = 0;
var generateTestUser = function () { return ({ name: 'test', id: String(counter++) }); };
exports.generateTestUser = generateTestUser;
var TestStrategy = /** @class */ (function (_super) {
    __extends(TestStrategy, _super);
    function TestStrategy() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TestStrategy.prototype.authenticate = function (request, _options) {
        if (request.isAuthenticated()) {
            return this.pass();
        }
        if (request.body && request.body.login === 'test' && request.body.password === 'test') {
            return this.success((0, exports.generateTestUser)());
        }
        this.fail();
    };
    return TestStrategy;
}(strategies_1.Strategy));
exports.TestStrategy = TestStrategy;
var TestDatabaseStrategy = /** @class */ (function (_super) {
    __extends(TestDatabaseStrategy, _super);
    function TestDatabaseStrategy(name, database) {
        if (database === void 0) { database = {}; }
        var _this = _super.call(this, name) || this;
        _this.database = database;
        return _this;
    }
    TestDatabaseStrategy.prototype.authenticate = function (request, _options) {
        if (request.isAuthenticated()) {
            return this.pass();
        }
        if (request.body) {
            var user = Object.values(this.database).find(function (user) { return user.login == request.body.login && user.password == request.body.password; });
            if (user) {
                return this.success(user);
            }
        }
        this.fail();
    };
    return TestDatabaseStrategy;
}(strategies_1.Strategy));
exports.TestDatabaseStrategy = TestDatabaseStrategy;
/** Class representing a browser in tests */
var TestBrowserSession = /** @class */ (function () {
    function TestBrowserSession(server) {
        this.server = server;
        this.cookies = {};
    }
    TestBrowserSession.prototype.inject = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var result, _i, _a, _b, name_1, value;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        opts.headers || (opts.headers = {});
                        opts.headers.cookie = Object.entries(this.cookies)
                            .map(function (_a) {
                            var key = _a[0], value = _a[1];
                            return "".concat(key, "=").concat(value);
                        })
                            .join('; ');
                        return [4 /*yield*/, this.server.inject(opts)];
                    case 1:
                        result = _c.sent();
                        if (result.statusCode < 500) {
                            for (_i = 0, _a = (0, set_cookie_parser_1.default)(result, { decodeValues: false }); _i < _a.length; _i++) {
                                _b = _a[_i], name_1 = _b.name, value = _b.value;
                                this.cookies[name_1] = value;
                            }
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    return TestBrowserSession;
}());
exports.TestBrowserSession = TestBrowserSession;
var loadSessionPlugins = function (server, sessionOptions) {
    if (sessionOptions === void 0) { sessionOptions = null; }
    if (process.env.SESSION_PLUGIN === '@fastify/session') {
        void server.register(cookie_1.default);
        var options = (sessionOptions || {
            secret: 'a secret with minimum length of 32 characters',
            cookie: { secure: false }
        });
        void server.register(session_1.fastifySession, options);
    }
    else {
        void server.register(secure_session_1.default, (sessionOptions || { key: SecretKey }));
    }
};
/** Create a fastify instance with a few simple setup bits added, but without fastify-passport registered or any strategies set up. */
var getTestServer = function (sessionOptions) {
    if (sessionOptions === void 0) { sessionOptions = null; }
    var server = (0, fastify_1.default)();
    loadSessionPlugins(server, sessionOptions);
    server.setErrorHandler(function (error, _request, reply) {
        void reply.status(500);
        void reply.send(error);
    });
    return server;
};
exports.getTestServer = getTestServer;
/** Create a fastify instance with fastify-passport plugin registered but with no strategies registered yet. */
var getRegisteredTestServer = function (sessionOptions, passportOptions) {
    if (sessionOptions === void 0) { sessionOptions = null; }
    if (passportOptions === void 0) { passportOptions = {}; }
    var fastifyPassport = new Authenticator_1.default(passportOptions);
    fastifyPassport.registerUserSerializer(function (user) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, JSON.stringify(user)];
    }); }); });
    fastifyPassport.registerUserDeserializer(function (serialized) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, JSON.parse(serialized)];
    }); }); });
    var server = (0, exports.getTestServer)(sessionOptions);
    void server.register(fastifyPassport.initialize());
    void server.register(fastifyPassport.secureSession());
    return { fastifyPassport: fastifyPassport, server: server };
};
exports.getRegisteredTestServer = getRegisteredTestServer;
/** Create a fastify instance with fastify-passport plugin registered and the given strategy registered with it. */
var getConfiguredTestServer = function (name, strategy, sessionOptions, passportOptions) {
    if (name === void 0) { name = 'test'; }
    if (strategy === void 0) { strategy = new TestStrategy('test'); }
    if (sessionOptions === void 0) { sessionOptions = null; }
    if (passportOptions === void 0) { passportOptions = {}; }
    var _a = (0, exports.getRegisteredTestServer)(sessionOptions, passportOptions), fastifyPassport = _a.fastifyPassport, server = _a.server;
    fastifyPassport.use(name, strategy);
    return { fastifyPassport: fastifyPassport, server: server };
};
exports.getConfiguredTestServer = getConfiguredTestServer;
