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
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-floating-promises */
var node_test_1 = require("node:test");
var node_assert_1 = require("node:assert");
var helpers_1 = require("./helpers");
var testSuite = function (sessionPluginName) {
    (0, node_test_1.describe)("".concat(sessionPluginName, " tests"), function () {
        var sessionOnlyTest = sessionPluginName === '@fastify/session' ? node_test_1.test : node_test_1.test.skip;
        var secureSessionOnlyTest = sessionPluginName === '@fastify/secure-session' ? node_test_1.test : node_test_1.test.skip;
        (0, node_test_1.describe)('Request decorators', function () {
            (0, node_test_1.test)('logIn allows logging in an arbitrary user', function () { return __awaiter(void 0, void 0, void 0, function () {
                var _a, server, fastifyPassport, login, response;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = (0, helpers_1.getConfiguredTestServer)(), server = _a.server, fastifyPassport = _a.fastifyPassport;
                            server.get('/', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, function (request) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, request.user.name];
                            }); }); });
                            server.post('/force-login', function (request, reply) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, request.logIn({ name: 'force logged in user' })];
                                        case 1:
                                            _a.sent();
                                            void reply.send('logged in');
                                            return [2 /*return*/];
                                    }
                                });
                            }); });
                            return [4 /*yield*/, server.inject({
                                    method: 'POST',
                                    url: '/force-login'
                                })];
                        case 1:
                            login = _b.sent();
                            node_assert_1.default.strictEqual(login.statusCode, 200);
                            return [4 /*yield*/, server.inject({
                                    url: '/',
                                    headers: {
                                        cookie: login.headers['set-cookie']
                                    },
                                    method: 'GET'
                                })];
                        case 2:
                            response = _b.sent();
                            node_assert_1.default.strictEqual(login.statusCode, 200);
                            node_assert_1.default.strictEqual(response.body, 'force logged in user');
                            return [2 /*return*/];
                    }
                });
            }); });
            secureSessionOnlyTest('logIn allows logging in an arbitrary user for the duration of the request if session=false', function () { return __awaiter(void 0, void 0, void 0, function () {
                var server, login;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            server = (0, helpers_1.getConfiguredTestServer)().server;
                            server.post('/force-login', function (request, reply) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, request.logIn({ name: 'force logged in user' }, { session: false })];
                                        case 1:
                                            _a.sent();
                                            void reply.send(request.user.name);
                                            return [2 /*return*/];
                                    }
                                });
                            }); });
                            return [4 /*yield*/, server.inject({
                                    method: 'POST',
                                    url: '/force-login'
                                })];
                        case 1:
                            login = _a.sent();
                            node_assert_1.default.strictEqual(login.statusCode, 200);
                            node_assert_1.default.strictEqual(login.body, 'force logged in user');
                            node_assert_1.default.strictEqual(login.headers['set-cookie'], undefined); // no user added to session
                            return [2 /*return*/];
                    }
                });
            }); });
            sessionOnlyTest('logIn allows logging in an arbitrary user for the duration of the request if session=false', function () { return __awaiter(void 0, void 0, void 0, function () {
                var sessionOptions, server, login;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            sessionOptions = {
                                secret: 'a secret with minimum length of 32 characters',
                                cookie: { secure: false },
                                saveUninitialized: false
                            };
                            server = (0, helpers_1.getConfiguredTestServer)('test', new helpers_1.TestStrategy('test'), sessionOptions).server;
                            server.post('/force-login', function (request, reply) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, request.logIn({ name: 'force logged in user' }, { session: false })];
                                        case 1:
                                            _a.sent();
                                            void reply.send(request.user.name);
                                            return [2 /*return*/];
                                    }
                                });
                            }); });
                            return [4 /*yield*/, server.inject({
                                    method: 'POST',
                                    url: '/force-login'
                                })];
                        case 1:
                            login = _a.sent();
                            node_assert_1.default.strictEqual(login.statusCode, 200);
                            node_assert_1.default.strictEqual(login.body, 'force logged in user');
                            node_assert_1.default.strictEqual(login.headers['set-cookie'], undefined); // no user added to session
                            return [2 /*return*/];
                    }
                });
            }); });
            (0, node_test_1.test)("should logout", function () { return __awaiter(void 0, void 0, void 0, function () {
                var _a, server, fastifyPassport, login, logout, retry;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = (0, helpers_1.getConfiguredTestServer)(), server = _a.server, fastifyPassport = _a.fastifyPassport;
                            server.get('/', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, 'the root!'];
                            }); }); });
                            server.get('/logout', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, function (request, reply) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    void request.logout();
                                    void reply.send('logged out');
                                    return [2 /*return*/];
                                });
                            }); });
                            server.post('/login', { preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: false }) }, function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, ''];
                            }); }); });
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
                                    url: '/logout',
                                    headers: {
                                        cookie: login.headers['set-cookie']
                                    },
                                    method: 'GET'
                                })];
                        case 2:
                            logout = _b.sent();
                            node_assert_1.default.strictEqual(logout.statusCode, 200);
                            node_assert_1.default.ok(logout.headers['set-cookie']);
                            return [4 /*yield*/, server.inject({
                                    url: '/',
                                    headers: {
                                        cookie: logout.headers['set-cookie']
                                    },
                                    method: 'GET'
                                })];
                        case 3:
                            retry = _b.sent();
                            node_assert_1.default.strictEqual(retry.statusCode, 401);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
};
testSuite('@fastify/session');
testSuite('@fastify/secure-session');
