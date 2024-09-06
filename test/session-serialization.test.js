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
var Authenticator_1 = require("../src/Authenticator");
var helpers_1 = require("./helpers");
var testSuite = function (sessionPluginName) {
    (0, node_test_1.describe)("".concat(sessionPluginName, " tests"), function () {
        (0, node_test_1.describe)('Authenticator session serialization', function () {
            (0, node_test_1.test)('it should roundtrip a user', function () { return __awaiter(void 0, void 0, void 0, function () {
                var fastifyPassport, user, request, _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            fastifyPassport = new Authenticator_1.default();
                            fastifyPassport.registerUserSerializer(function (user) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, JSON.stringify(user)];
                            }); }); });
                            fastifyPassport.registerUserDeserializer(function (serialized) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, JSON.parse(serialized)];
                            }); }); });
                            user = { name: 'foobar' };
                            request = {};
                            _b = (_a = node_assert_1.default).deepStrictEqual;
                            _d = (_c = fastifyPassport).deserializeUser;
                            return [4 /*yield*/, fastifyPassport.serializeUser(user, request)];
                        case 1: return [4 /*yield*/, _d.apply(_c, [_e.sent(), request])];
                        case 2:
                            _b.apply(_a, [_e.sent(), user]);
                            return [2 /*return*/];
                    }
                });
            }); });
            var setupSerializationTestServer = function (fastifyPassport) { return __awaiter(void 0, void 0, void 0, function () {
                var server;
                return __generator(this, function (_a) {
                    server = (0, helpers_1.getTestServer)();
                    void server.register(fastifyPassport.initialize());
                    void server.register(fastifyPassport.secureSession());
                    server.get('/', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, 'hello world!'];
                    }); }); });
                    server.post('/login', { preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: false }) }, function () { });
                    server.get('/unprotected', function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, 'some content'];
                    }); }); });
                    return [2 /*return*/, server];
                });
            }); };
            var verifySuccessfulLogin = function (server) { return __awaiter(void 0, void 0, void 0, function () {
                var loginResponse, homeResponse;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, server.inject({
                                method: 'POST',
                                url: '/login',
                                payload: { login: 'test', password: 'test' }
                            })];
                        case 1:
                            loginResponse = _a.sent();
                            node_assert_1.default.strictEqual(loginResponse.statusCode, 302);
                            node_assert_1.default.strictEqual(loginResponse.headers.location, '/');
                            return [4 /*yield*/, server.inject({
                                    url: '/',
                                    headers: {
                                        cookie: loginResponse.headers['set-cookie']
                                    },
                                    method: 'GET'
                                })];
                        case 2:
                            homeResponse = _a.sent();
                            node_assert_1.default.strictEqual(homeResponse.body, 'hello world!');
                            node_assert_1.default.strictEqual(homeResponse.statusCode, 200);
                            return [2 /*return*/];
                    }
                });
            }); };
            (0, node_test_1.test)('should allow multiple user serializers and deserializers', function () { return __awaiter(void 0, void 0, void 0, function () {
                var fastifyPassport, server;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            fastifyPassport = new Authenticator_1.default();
                            fastifyPassport.use('test', new helpers_1.TestStrategy('test'));
                            fastifyPassport.registerUserSerializer(function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    throw 'pass';
                                });
                            }); });
                            fastifyPassport.registerUserSerializer(function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    throw 'pass';
                                });
                            }); });
                            fastifyPassport.registerUserSerializer(function (user) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, JSON.stringify(user)];
                                });
                            }); });
                            fastifyPassport.registerUserDeserializer(function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    throw 'pass';
                                });
                            }); });
                            fastifyPassport.registerUserDeserializer(function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    throw 'pass';
                                });
                            }); });
                            fastifyPassport.registerUserDeserializer(function (serialized) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, JSON.parse(serialized)];
                            }); }); });
                            return [4 /*yield*/, setupSerializationTestServer(fastifyPassport)];
                        case 1:
                            server = _a.sent();
                            return [4 /*yield*/, verifySuccessfulLogin(server)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            (0, node_test_1.test)('should allow user serializers/deserializers that work like a database', function () { return __awaiter(void 0, void 0, void 0, function () {
                var fastifyPassport, strategy, server;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            fastifyPassport = new Authenticator_1.default();
                            strategy = new helpers_1.TestDatabaseStrategy('test', { '1': { id: '1', login: 'test', password: 'test' } });
                            fastifyPassport.use('test', strategy);
                            fastifyPassport.registerUserSerializer(function (user) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, user.id];
                            }); }); });
                            fastifyPassport.registerUserDeserializer(function (serialized) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, strategy.database[serialized]];
                            }); }); });
                            return [4 /*yield*/, setupSerializationTestServer(fastifyPassport)];
                        case 1:
                            server = _a.sent();
                            return [4 /*yield*/, verifySuccessfulLogin(server)];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, verifySuccessfulLogin(server)];
                        case 3:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            (0, node_test_1.test)('should throw if user deserializers return undefined', function () { return __awaiter(void 0, void 0, void 0, function () {
                var fastifyPassport, strategy, server, loginResponse, homeResponse, otherResponse;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            // jest.spyOn(console, 'error').mockImplementation(jest.fn())
                            console.error = node_test_1.mock.fn();
                            fastifyPassport = new Authenticator_1.default();
                            strategy = new helpers_1.TestDatabaseStrategy('test', { '1': { id: '1', login: 'test', password: 'test' } });
                            fastifyPassport.use('test', strategy);
                            fastifyPassport.registerUserSerializer(function (user) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, user.id];
                            }); }); });
                            fastifyPassport.registerUserDeserializer(function (serialized) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, strategy.database[serialized]];
                            }); }); });
                            return [4 /*yield*/, setupSerializationTestServer(fastifyPassport)];
                        case 1:
                            server = _c.sent();
                            return [4 /*yield*/, verifySuccessfulLogin(server)];
                        case 2:
                            _c.sent();
                            return [4 /*yield*/, server.inject({
                                    method: 'POST',
                                    url: '/login',
                                    payload: { login: 'test', password: 'test' }
                                })];
                        case 3:
                            loginResponse = _c.sent();
                            node_assert_1.default.strictEqual(loginResponse.statusCode, 302);
                            node_assert_1.default.strictEqual(loginResponse.headers.location, '/');
                            // user id 1 is logged in now, simulate deleting them from the database while logged in
                            delete strategy.database['1'];
                            return [4 /*yield*/, server.inject({
                                    url: '/',
                                    headers: {
                                        cookie: loginResponse.headers['set-cookie']
                                    },
                                    method: 'GET'
                                })];
                        case 4:
                            homeResponse = _c.sent();
                            node_assert_1.default.strictEqual(homeResponse.statusCode, 500);
                            node_assert_1.default.strictEqual((_a = JSON.parse(homeResponse.body)) === null || _a === void 0 ? void 0 : _a.message, 'Failed to deserialize user out of session. Tried 1 serializers.');
                            return [4 /*yield*/, server.inject({
                                    url: '/unprotected',
                                    headers: {
                                        cookie: loginResponse.headers['set-cookie']
                                    },
                                    method: 'GET'
                                })];
                        case 5:
                            otherResponse = _c.sent();
                            node_assert_1.default.strictEqual(otherResponse.statusCode, 500);
                            node_assert_1.default.strictEqual((_b = JSON.parse(otherResponse.body)) === null || _b === void 0 ? void 0 : _b.message, 'Failed to deserialize user out of session. Tried 1 serializers.');
                            return [2 /*return*/];
                    }
                });
            }); });
            (0, node_test_1.test)('should deny access if user deserializers return null for logged in sessions', function () { return __awaiter(void 0, void 0, void 0, function () {
                var fastifyPassport, strategy, server, loginResponse, homeResponse, otherResponse;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            fastifyPassport = new Authenticator_1.default();
                            strategy = new helpers_1.TestDatabaseStrategy('test', { '1': { id: '1', login: 'test', password: 'test' } });
                            fastifyPassport.use('test', strategy);
                            fastifyPassport.registerUserSerializer(function (user) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, user.id];
                            }); }); });
                            fastifyPassport.registerUserDeserializer(function (serialized) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, strategy.database[serialized] || null];
                            }); }); });
                            return [4 /*yield*/, setupSerializationTestServer(fastifyPassport)];
                        case 1:
                            server = _a.sent();
                            return [4 /*yield*/, verifySuccessfulLogin(server)];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, server.inject({
                                    method: 'POST',
                                    url: '/login',
                                    payload: { login: 'test', password: 'test' }
                                })];
                        case 3:
                            loginResponse = _a.sent();
                            node_assert_1.default.strictEqual(loginResponse.statusCode, 302);
                            node_assert_1.default.strictEqual(loginResponse.headers.location, '/');
                            // user id 1 is logged in now, simulate deleting them from the database while logged in
                            delete strategy.database['1'];
                            return [4 /*yield*/, server.inject({
                                    url: '/',
                                    headers: {
                                        cookie: loginResponse.headers['set-cookie']
                                    },
                                    method: 'GET'
                                })];
                        case 4:
                            homeResponse = _a.sent();
                            node_assert_1.default.strictEqual(homeResponse.statusCode, 401);
                            return [4 /*yield*/, server.inject({
                                    url: '/unprotected',
                                    headers: {
                                        cookie: loginResponse.headers['set-cookie']
                                    },
                                    method: 'GET'
                                })];
                        case 5:
                            otherResponse = _a.sent();
                            node_assert_1.default.strictEqual(otherResponse.statusCode, 200);
                            node_assert_1.default.strictEqual(otherResponse.body, 'some content');
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
};
testSuite('@fastify/session');
testSuite('@fastify/secure-session');
