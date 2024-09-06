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
function createServer() {
    var _this = this;
    var _a = (0, helpers_1.getConfiguredTestServer)(), server = _a.server, fastifyPassport = _a.fastifyPassport;
    server.get('/protected', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, 'hello!'];
    }); }); });
    server.get('/my-id', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, function (request) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, String(request.user.id)];
    }); }); });
    server.post('/login', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, 'success'];
    }); }); });
    server.post('/force-login', function (request, reply) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, request.logIn((0, helpers_1.generateTestUser)())];
                case 1:
                    _a.sent();
                    void reply.send('logged in');
                    return [2 /*return*/];
            }
        });
    }); });
    server.post('/logout', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, function (request, reply) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, request.logout()];
                case 1:
                    _a.sent();
                    void reply.send('logged out');
                    return [2 /*return*/];
            }
        });
    }); });
    return server;
}
var testSuite = function (sessionPluginName) {
    process.env.SESSION_PLUGIN = sessionPluginName;
    var server = createServer();
    (0, node_test_1.describe)("".concat(sessionPluginName, " tests"), function () {
        var sessionOnlyTest = sessionPluginName === '@fastify/session' ? node_test_1.test : node_test_1.test.skip;
        (0, node_test_1.describe)('session isolation', function () {
            var userA, userB, userC;
            (0, node_test_1.beforeEach)(function () {
                userA = new helpers_1.TestBrowserSession(server);
                userB = new helpers_1.TestBrowserSession(server);
                userC = new helpers_1.TestBrowserSession(server);
            });
            (0, node_test_1.test)("should return 401 Unauthorized if not logged in", function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Promise.all([userA, userB, userC].map(function (user) { return __awaiter(void 0, void 0, void 0, function () {
                                var response;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, user.inject({ method: 'GET', url: '/protected' })];
                                        case 1:
                                            response = _a.sent();
                                            node_assert_1.default.strictEqual(response.statusCode, 401);
                                            return [2 /*return*/];
                                    }
                                });
                            }); }))];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, Promise.all([userA, userB, userC].map(function (user) { return __awaiter(void 0, void 0, void 0, function () {
                                    var response;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, user.inject({ method: 'GET', url: '/protected' })];
                                            case 1:
                                                response = _a.sent();
                                                node_assert_1.default.strictEqual(response.statusCode, 401);
                                                return [2 /*return*/];
                                        }
                                    });
                                }); }))];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            (0, node_test_1.test)("logging in one user shouldn't log in the others", function () { return __awaiter(void 0, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Promise.all([userA, userB, userC].map(function (user) { return __awaiter(void 0, void 0, void 0, function () {
                                var response;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, user.inject({ method: 'GET', url: '/protected' })];
                                        case 1:
                                            response = _a.sent();
                                            node_assert_1.default.strictEqual(response.statusCode, 401);
                                            return [2 /*return*/];
                                    }
                                });
                            }); }))];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, userA.inject({
                                    method: 'POST',
                                    url: '/login',
                                    payload: { login: 'test', password: 'test' }
                                })];
                        case 2:
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 200);
                            node_assert_1.default.strictEqual(response.body, 'success');
                            return [4 /*yield*/, userA.inject({ method: 'GET', url: '/protected' })];
                        case 3:
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 200);
                            node_assert_1.default.strictEqual(response.body, 'hello!');
                            return [4 /*yield*/, Promise.all([userB, userC].map(function (user) { return __awaiter(void 0, void 0, void 0, function () {
                                    var response;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, user.inject({ method: 'GET', url: '/protected' })];
                                            case 1:
                                                response = _a.sent();
                                                node_assert_1.default.strictEqual(response.statusCode, 401);
                                                return [2 /*return*/];
                                        }
                                    });
                                }); }))];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, userA.inject({ method: 'GET', url: '/protected' })];
                        case 5:
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 200);
                            node_assert_1.default.strictEqual(response.body, 'hello!');
                            return [2 /*return*/];
                    }
                });
            }); });
            (0, node_test_1.test)("logging in each user should keep their sessions independent", function () { return __awaiter(void 0, void 0, void 0, function () {
                var ids;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Promise.all([userA, userB, userC].map(function (user) { return __awaiter(void 0, void 0, void 0, function () {
                                var response;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, user.inject({
                                                method: 'POST',
                                                url: '/login',
                                                payload: { login: 'test', password: 'test' }
                                            })];
                                        case 1:
                                            response = _a.sent();
                                            node_assert_1.default.strictEqual(response.statusCode, 200);
                                            node_assert_1.default.strictEqual(response.body, 'success');
                                            return [4 /*yield*/, user.inject({ method: 'GET', url: '/protected' })];
                                        case 2:
                                            response = _a.sent();
                                            node_assert_1.default.strictEqual(response.statusCode, 200);
                                            node_assert_1.default.strictEqual(response.body, 'hello!');
                                            return [2 /*return*/];
                                    }
                                });
                            }); }))];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, Promise.all([userA, userB, userC].map(function (user) { return __awaiter(void 0, void 0, void 0, function () {
                                    var response;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, user.inject({ method: 'GET', url: '/my-id' })];
                                            case 1:
                                                response = _a.sent();
                                                node_assert_1.default.strictEqual(response.statusCode, 200);
                                                return [2 /*return*/, response.body];
                                        }
                                    });
                                }); }))
                                // assert.deepStrictEqual each returned ID to be unique
                            ];
                        case 2:
                            ids = _a.sent();
                            // assert.deepStrictEqual each returned ID to be unique
                            node_assert_1.default.deepStrictEqual(Array.from(new Set(ids)).sort(), ids.sort());
                            return [2 /*return*/];
                    }
                });
            }); });
            (0, node_test_1.test)("logging out one user shouldn't log out the others", function () { return __awaiter(void 0, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Promise.all([userA, userB, userC].map(function (user) { return __awaiter(void 0, void 0, void 0, function () {
                                var response;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, user.inject({
                                                method: 'POST',
                                                url: '/login',
                                                payload: { login: 'test', password: 'test' }
                                            })];
                                        case 1:
                                            response = _a.sent();
                                            node_assert_1.default.strictEqual(response.statusCode, 200);
                                            node_assert_1.default.strictEqual(response.body, 'success');
                                            return [4 /*yield*/, user.inject({ method: 'GET', url: '/protected' })];
                                        case 2:
                                            response = _a.sent();
                                            node_assert_1.default.strictEqual(response.statusCode, 200);
                                            node_assert_1.default.strictEqual(response.body, 'hello!');
                                            return [2 /*return*/];
                                    }
                                });
                            }); }))];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, userB.inject({
                                    url: '/logout',
                                    method: 'POST'
                                })];
                        case 2:
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 200);
                            return [4 /*yield*/, userB.inject({
                                    url: '/protected',
                                    method: 'GET'
                                })];
                        case 3:
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 401);
                            return [4 /*yield*/, Promise.all([userA, userC].map(function (user) { return __awaiter(void 0, void 0, void 0, function () {
                                    var response;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, user.inject({ method: 'GET', url: '/protected' })];
                                            case 1:
                                                response = _a.sent();
                                                node_assert_1.default.strictEqual(response.statusCode, 200);
                                                node_assert_1.default.strictEqual(response.body, 'hello!');
                                                return [2 /*return*/];
                                        }
                                    });
                                }); }))];
                        case 4:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            (0, node_test_1.test)("force logging in users shouldn't change the login state of the others", function () { return __awaiter(void 0, void 0, void 0, function () {
                var ids;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Promise.all([userA, userB, userC].map(function (user) { return __awaiter(void 0, void 0, void 0, function () {
                                var response;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, user.inject({ method: 'POST', url: '/force-login' })];
                                        case 1:
                                            response = _a.sent();
                                            node_assert_1.default.strictEqual(response.statusCode, 200);
                                            return [2 /*return*/];
                                    }
                                });
                            }); }))];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, Promise.all([userA, userB, userC].map(function (user) { return __awaiter(void 0, void 0, void 0, function () {
                                    var response;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, user.inject({ method: 'GET', url: '/my-id' })];
                                            case 1:
                                                response = _a.sent();
                                                node_assert_1.default.strictEqual(response.statusCode, 200);
                                                return [2 /*return*/, response.body];
                                        }
                                    });
                                }); }))
                                // assert.deepStrictEqual each returned ID to be unique
                            ];
                        case 2:
                            ids = _a.sent();
                            // assert.deepStrictEqual each returned ID to be unique
                            node_assert_1.default.deepStrictEqual(Array.from(new Set(ids)).sort(), ids.sort());
                            return [2 /*return*/];
                    }
                });
            }); });
            sessionOnlyTest('should regenerate session on login', function () { return __awaiter(void 0, void 0, void 0, function () {
                var prevSessionId;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            node_assert_1.default.strictEqual(userA.cookies['sessionId'], undefined);
                            return [4 /*yield*/, userA.inject({ method: 'GET', url: '/protected' })];
                        case 1:
                            _a.sent();
                            node_assert_1.default.ok(userA.cookies['sessionId']);
                            prevSessionId = userA.cookies.sessionId;
                            return [4 /*yield*/, userA.inject({
                                    method: 'POST',
                                    url: '/login',
                                    payload: { login: 'test', password: 'test' }
                                })];
                        case 2:
                            _a.sent();
                            node_assert_1.default.notStrictEqual(userA.cookies.sessionId, prevSessionId);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
    delete process.env.SESSION_PLUGIN;
};
testSuite('@fastify/session');
testSuite('@fastify/secure-session');
