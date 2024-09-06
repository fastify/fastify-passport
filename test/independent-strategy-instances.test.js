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
/* eslint-disable @typescript-eslint/no-floating-promises */
var node_test_1 = require("node:test");
var node_assert_1 = require("node:assert");
var strategies_1 = require("../src/strategies");
var authorize_test_1 = require("./authorize.test");
var helpers_1 = require("./helpers");
var WelcomeStrategy = /** @class */ (function (_super) {
    __extends(WelcomeStrategy, _super);
    function WelcomeStrategy() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    WelcomeStrategy.prototype.authenticate = function (request, _options) {
        if (request.isAuthenticated()) {
            return this.pass();
        }
        if (request.body && request.body.login === 'welcomeuser' && request.body.password === 'test') {
            return this.success({ name: 'test' }, { message: 'welcome from strategy' });
        }
        this.fail();
    };
    return WelcomeStrategy;
}(strategies_1.Strategy));
var testSuite = function (sessionPluginName) {
    (0, node_test_1.describe)("".concat(sessionPluginName, " tests"), function () {
        (0, node_test_1.test)("should allow passing a specific Strategy instance to an authenticate call", function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, server, fastifyPassport, login, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, helpers_1.getRegisteredTestServer)(null, { clearSessionIgnoreFields: ['messages'] }), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', {
                            preValidation: fastifyPassport.authenticate(new WelcomeStrategy('welcome'), { authInfo: false })
                        }, function (request) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, request.session.get('messages')];
                        }); }); });
                        server.post('/login', {
                            preValidation: fastifyPassport.authenticate(new WelcomeStrategy('welcome'), {
                                successRedirect: '/',
                                successMessage: true,
                                authInfo: false
                            })
                        }, function () { });
                        return [4 /*yield*/, server.inject({
                                method: 'POST',
                                payload: { login: 'welcomeuser', password: 'test' },
                                url: '/login'
                            })];
                    case 1:
                        login = _b.sent();
                        node_assert_1.default.strictEqual(login.statusCode, 302);
                        node_assert_1.default.strictEqual(login.headers.location, '/');
                        return [4 /*yield*/, server.inject({
                                url: '/',
                                headers: {
                                    cookie: login.headers['set-cookie']
                                },
                                method: 'GET'
                            })];
                    case 2:
                        response = _b.sent();
                        node_assert_1.default.strictEqual(response.body, '["welcome from strategy"]');
                        node_assert_1.default.strictEqual(response.statusCode, 200);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)("should allow passing a multiple specific Strategy instances to an authenticate call", function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, server, fastifyPassport, login, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, helpers_1.getRegisteredTestServer)(), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', {
                            preValidation: fastifyPassport.authenticate([new WelcomeStrategy('welcome'), new helpers_1.TestStrategy('test')], {
                                authInfo: false
                            })
                        }, function (request) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, "messages: ".concat(request.session.get('messages'))];
                        }); }); });
                        server.post('/login', {
                            preValidation: fastifyPassport.authenticate([new WelcomeStrategy('welcome'), new helpers_1.TestStrategy('test')], {
                                successRedirect: '/',
                                successMessage: true,
                                authInfo: false
                            })
                        }, function () { });
                        return [4 /*yield*/, server.inject({
                                method: 'POST',
                                payload: { login: 'test', password: 'test' },
                                url: '/login'
                            })];
                    case 1:
                        login = _b.sent();
                        node_assert_1.default.strictEqual(login.statusCode, 302);
                        node_assert_1.default.strictEqual(login.headers.location, '/');
                        return [4 /*yield*/, server.inject({
                                url: '/',
                                headers: {
                                    cookie: login.headers['set-cookie']
                                },
                                method: 'GET'
                            })];
                    case 2:
                        response = _b.sent();
                        node_assert_1.default.strictEqual(response.body, 'messages: undefined');
                        node_assert_1.default.strictEqual(response.statusCode, 200);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)("should allow passing a mix of Strategy instances and strategy names", function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, server, fastifyPassport, login, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, helpers_1.getConfiguredTestServer)(), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', {
                            preValidation: fastifyPassport.authenticate([new WelcomeStrategy('welcome'), 'test'], {
                                authInfo: false
                            })
                        }, function (request) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, "messages: ".concat(request.session.get('messages'))];
                        }); }); });
                        server.post('/login', {
                            preValidation: fastifyPassport.authenticate([new WelcomeStrategy('welcome'), 'test'], {
                                successRedirect: '/',
                                successMessage: true,
                                authInfo: false
                            })
                        }, function () { });
                        return [4 /*yield*/, server.inject({
                                method: 'POST',
                                payload: { login: 'test', password: 'test' },
                                url: '/login'
                            })];
                    case 1:
                        login = _b.sent();
                        node_assert_1.default.strictEqual(login.statusCode, 302);
                        node_assert_1.default.strictEqual(login.headers.location, '/');
                        return [4 /*yield*/, server.inject({
                                url: '/',
                                headers: {
                                    cookie: login.headers['set-cookie']
                                },
                                method: 'GET'
                            })];
                    case 2:
                        response = _b.sent();
                        node_assert_1.default.strictEqual(response.body, 'messages: undefined');
                        node_assert_1.default.strictEqual(response.statusCode, 200);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)("should allow passing specific instances to an authorize call", function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, server, fastifyPassport, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, helpers_1.getConfiguredTestServer)(), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', { preValidation: fastifyPassport.authorize(new authorize_test_1.TestThirdPartyStrategy('third-party')) }, function (request) { return __awaiter(void 0, void 0, void 0, function () {
                            var user, account;
                            return __generator(this, function (_a) {
                                user = request.user;
                                node_assert_1.default.ifError(user);
                                account = request.account;
                                node_assert_1.default.ok(account.id);
                                node_assert_1.default.strictEqual(account.name, 'test');
                                return [2 /*return*/, 'it worked'];
                            });
                        }); });
                        return [4 /*yield*/, server.inject({ method: 'GET', url: '/' })];
                    case 1:
                        response = _b.sent();
                        node_assert_1.default.strictEqual(response.statusCode, 200);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)("Strategy instances used during one authentication shouldn't be registered", function () { return __awaiter(void 0, void 0, void 0, function () {
            var fastifyPassport;
            return __generator(this, function (_a) {
                fastifyPassport = (0, helpers_1.getRegisteredTestServer)().fastifyPassport;
                // build a handler with the welcome strategy
                fastifyPassport.authenticate(new WelcomeStrategy('welcome'), { authInfo: false });
                node_assert_1.default.strictEqual(fastifyPassport.strategy('welcome'), undefined);
                return [2 /*return*/];
            });
        }); });
    });
};
testSuite('@fastify/session');
testSuite('@fastify/secure-session');
