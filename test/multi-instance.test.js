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
var Authenticator_1 = require("../src/Authenticator");
var strategies_1 = require("../src/strategies");
var helpers_1 = require("./helpers");
var counter;
var authenticators;
function TestStrategyModule(instance_1, _a) {
    return __awaiter(this, arguments, void 0, function (instance, _b) {
        var TestStrategy, strategyName, authenticator;
        var _this = this;
        var namespace = _b.namespace, clearSessionOnLogin = _b.clearSessionOnLogin;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    TestStrategy = /** @class */ (function (_super) {
                        __extends(TestStrategy, _super);
                        function TestStrategy() {
                            return _super !== null && _super.apply(this, arguments) || this;
                        }
                        TestStrategy.prototype.authenticate = function (request, _options) {
                            if (request.isAuthenticated()) {
                                return this.pass();
                            }
                            if (request.body && request.body.login === 'test' && request.body.password === 'test') {
                                return this.success({ namespace: namespace, id: String(counter++) });
                            }
                            this.fail();
                        };
                        return TestStrategy;
                    }(strategies_1.Strategy));
                    strategyName = "test-".concat(namespace);
                    authenticator = new Authenticator_1.Authenticator({
                        key: "passport".concat(namespace),
                        userProperty: "user".concat(namespace),
                        clearSessionOnLogin: clearSessionOnLogin
                    });
                    authenticator.use(strategyName, new TestStrategy(strategyName));
                    authenticator.registerUserSerializer(function (user) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            if (user.namespace == namespace) {
                                return [2 /*return*/, namespace + '-' + JSON.stringify(user)];
                            }
                            throw 'pass';
                        });
                    }); });
                    authenticator.registerUserDeserializer(function (serialized) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            if (serialized.startsWith("".concat(namespace, "-"))) {
                                return [2 /*return*/, JSON.parse(serialized.slice("".concat(namespace, "-").length))];
                            }
                            throw 'pass';
                        });
                    }); });
                    return [4 /*yield*/, instance.register(authenticator.initialize())];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, instance.register(authenticator.secureSession())];
                case 2:
                    _c.sent();
                    authenticators[namespace] = authenticator;
                    instance.get("/".concat(namespace), { preValidation: authenticator.authenticate(strategyName, { authInfo: false }) }, function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, "hello ".concat(namespace, "!")];
                    }); }); });
                    instance.get("/user/".concat(namespace), { preValidation: authenticator.authenticate(strategyName, { authInfo: false }) }, function (request) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, JSON.stringify(request["user".concat(namespace)])];
                    }); }); });
                    instance.post("/login-".concat(namespace), {
                        preValidation: authenticator.authenticate(strategyName, {
                            successRedirect: "/".concat(namespace),
                            authInfo: false
                        })
                    }, function () {
                        return;
                    });
                    instance.post("/logout-".concat(namespace), { preValidation: authenticator.authenticate(strategyName, { authInfo: false }) }, function (request, reply) { return __awaiter(_this, void 0, void 0, function () {
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
                    return [2 /*return*/];
            }
        });
    });
}
var testSuite = function (sessionPluginName) {
    (0, node_test_1.describe)("".concat(sessionPluginName, " tests"), function () {
        (0, node_test_1.describe)('multiple registered instances (clearSessionOnLogin: false)', function () {
            var server;
            var session;
            (0, node_test_1.beforeEach)(function () { return __awaiter(void 0, void 0, void 0, function () {
                var _i, _a, namespace;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            counter = 0;
                            authenticators = {};
                            server = (0, helpers_1.getTestServer)();
                            session = new helpers_1.TestBrowserSession(server);
                            _i = 0, _a = ['a', 'b'];
                            _b.label = 1;
                        case 1:
                            if (!(_i < _a.length)) return [3 /*break*/, 4];
                            namespace = _a[_i];
                            return [4 /*yield*/, server.register(TestStrategyModule, { namespace: namespace, clearSessionOnLogin: false })];
                        case 2:
                            _b.sent();
                            _b.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            (0, node_test_1.test)('logging in with one instance should not log in the other instance', function () { return __awaiter(void 0, void 0, void 0, function () {
                var response, loginResponse;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, session.inject({ method: 'GET', url: '/a' })];
                        case 1:
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.body, 'Unauthorized');
                            node_assert_1.default.strictEqual(response.statusCode, 401);
                            return [4 /*yield*/, session.inject({ method: 'GET', url: '/b' })];
                        case 2:
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.body, 'Unauthorized');
                            node_assert_1.default.strictEqual(response.statusCode, 401);
                            return [4 /*yield*/, session.inject({
                                    method: 'POST',
                                    url: '/login-a',
                                    payload: { login: 'test', password: 'test' }
                                })];
                        case 3:
                            loginResponse = _a.sent();
                            node_assert_1.default.strictEqual(loginResponse.statusCode, 302);
                            node_assert_1.default.strictEqual(loginResponse.headers.location, '/a');
                            return [4 /*yield*/, session.inject({
                                    method: 'GET',
                                    url: '/a'
                                })];
                        case 4:
                            // access protected route
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 200);
                            node_assert_1.default.strictEqual(response.body, 'hello a!');
                            return [4 /*yield*/, session.inject({
                                    method: 'GET',
                                    url: '/user/a'
                                })];
                        case 5:
                            // access user data
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 200);
                            return [4 /*yield*/, session.inject({
                                    method: 'GET',
                                    url: '/b'
                                })];
                        case 6:
                            // try to access route protected by other instance
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 401);
                            return [2 /*return*/];
                    }
                });
            }); });
            (0, node_test_1.test)('simultaneous login should be possible', function () { return __awaiter(void 0, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, session.inject({
                                method: 'POST',
                                url: '/login-a',
                                payload: { login: 'test', password: 'test' }
                            })];
                        case 1:
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 302);
                            node_assert_1.default.strictEqual(response.headers.location, '/a');
                            return [4 /*yield*/, session.inject({
                                    method: 'POST',
                                    url: '/login-b',
                                    payload: { login: 'test', password: 'test' }
                                })];
                        case 2:
                            // login b
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 302);
                            node_assert_1.default.strictEqual(response.headers.location, '/b');
                            return [4 /*yield*/, session.inject({
                                    method: 'GET',
                                    url: '/a'
                                })];
                        case 3:
                            // access a protected route
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 200);
                            node_assert_1.default.strictEqual(response.body, 'hello a!');
                            return [4 /*yield*/, session.inject({
                                    method: 'GET',
                                    url: '/b'
                                })];
                        case 4:
                            // access b protected route
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 200);
                            node_assert_1.default.strictEqual(response.body, 'hello b!');
                            return [2 /*return*/];
                    }
                });
            }); });
            (0, node_test_1.test)('logging out with one instance should not log out the other instance', function () { return __awaiter(void 0, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, session.inject({
                                method: 'POST',
                                url: '/login-a',
                                payload: { login: 'test', password: 'test' }
                            })];
                        case 1:
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 302);
                            node_assert_1.default.strictEqual(response.headers.location, '/a');
                            return [4 /*yield*/, session.inject({
                                    method: 'POST',
                                    url: '/login-b',
                                    payload: { login: 'test', password: 'test' }
                                })];
                        case 2:
                            // login b
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 302);
                            node_assert_1.default.strictEqual(response.headers.location, '/b');
                            return [4 /*yield*/, session.inject({
                                    method: 'POST',
                                    url: '/logout-a'
                                })];
                        case 3:
                            // logout a
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 200);
                            return [4 /*yield*/, session.inject({
                                    method: 'GET',
                                    url: '/a'
                                })];
                        case 4:
                            // try to access route protected by now logged out instance
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 401);
                            return [4 /*yield*/, session.inject({
                                    method: 'GET',
                                    url: '/b'
                                })];
                        case 5:
                            // access b protected route which should still be logged in
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 200);
                            node_assert_1.default.strictEqual(response.body, 'hello b!');
                            return [2 /*return*/];
                    }
                });
            }); });
            (0, node_test_1.test)('user objects from different instances should be different', function () { return __awaiter(void 0, void 0, void 0, function () {
                var response, userA, userB;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, session.inject({
                                method: 'POST',
                                url: '/login-a',
                                payload: { login: 'test', password: 'test' }
                            })];
                        case 1:
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 302);
                            node_assert_1.default.strictEqual(response.headers.location, '/a');
                            return [4 /*yield*/, session.inject({
                                    method: 'POST',
                                    url: '/login-b',
                                    payload: { login: 'test', password: 'test' }
                                })];
                        case 2:
                            // login b
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 302);
                            node_assert_1.default.strictEqual(response.headers.location, '/b');
                            return [4 /*yield*/, session.inject({
                                    method: 'GET',
                                    url: '/user/a'
                                })];
                        case 3:
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 200);
                            userA = JSON.parse(response.body);
                            return [4 /*yield*/, session.inject({
                                    method: 'GET',
                                    url: '/user/b'
                                })];
                        case 4:
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 200);
                            userB = JSON.parse(response.body);
                            node_assert_1.default.notStrictEqual(userA.id, userB.id);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        (0, node_test_1.describe)('multiple registered instances (clearSessionOnLogin: true)', function () {
            var server;
            var session;
            (0, node_test_1.beforeEach)(function () { return __awaiter(void 0, void 0, void 0, function () {
                var _i, _a, namespace;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            server = (0, helpers_1.getTestServer)();
                            session = new helpers_1.TestBrowserSession(server);
                            authenticators = {};
                            counter = 0;
                            _i = 0, _a = ['a', 'b'];
                            _b.label = 1;
                        case 1:
                            if (!(_i < _a.length)) return [3 /*break*/, 4];
                            namespace = _a[_i];
                            return [4 /*yield*/, server.register(TestStrategyModule, { namespace: namespace, clearSessionOnLogin: true })];
                        case 2:
                            _b.sent();
                            _b.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            (0, node_test_1.test)('logging in with one instance should not log in the other instance', function () { return __awaiter(void 0, void 0, void 0, function () {
                var response, loginResponse;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, session.inject({ method: 'GET', url: '/a' })];
                        case 1:
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.body, 'Unauthorized');
                            node_assert_1.default.strictEqual(response.statusCode, 401);
                            return [4 /*yield*/, session.inject({ method: 'GET', url: '/b' })];
                        case 2:
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.body, 'Unauthorized');
                            node_assert_1.default.strictEqual(response.statusCode, 401);
                            return [4 /*yield*/, session.inject({
                                    method: 'POST',
                                    url: '/login-a',
                                    payload: { login: 'test', password: 'test' }
                                })];
                        case 3:
                            loginResponse = _a.sent();
                            node_assert_1.default.strictEqual(loginResponse.statusCode, 302);
                            node_assert_1.default.strictEqual(loginResponse.headers.location, '/a');
                            return [4 /*yield*/, session.inject({
                                    method: 'GET',
                                    url: '/a'
                                })];
                        case 4:
                            // access protected route
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 200);
                            node_assert_1.default.strictEqual(response.body, 'hello a!');
                            return [4 /*yield*/, session.inject({
                                    method: 'GET',
                                    url: '/user/a'
                                })];
                        case 5:
                            // access user data
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 200);
                            return [4 /*yield*/, session.inject({
                                    method: 'GET',
                                    url: '/b'
                                })];
                        case 6:
                            // try to access route protected by other instance
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 401);
                            return [2 /*return*/];
                    }
                });
            }); });
            (0, node_test_1.test)('simultaneous login should NOT be possible', function () { return __awaiter(void 0, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, session.inject({
                                method: 'POST',
                                url: '/login-a',
                                payload: { login: 'test', password: 'test' }
                            })];
                        case 1:
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 302);
                            node_assert_1.default.strictEqual(response.headers.location, '/a');
                            return [4 /*yield*/, session.inject({
                                    method: 'POST',
                                    url: '/login-b',
                                    payload: { login: 'test', password: 'test' }
                                })];
                        case 2:
                            // login b
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 302);
                            node_assert_1.default.strictEqual(response.headers.location, '/b');
                            return [4 /*yield*/, session.inject({
                                    method: 'GET',
                                    url: '/a'
                                })];
                        case 3:
                            // access a protected route (/a) was invalidated after login /b
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 401);
                            node_assert_1.default.strictEqual(response.body, 'Unauthorized');
                            return [4 /*yield*/, session.inject({
                                    method: 'GET',
                                    url: '/b'
                                })];
                        case 4:
                            // access b protected route
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 200);
                            node_assert_1.default.strictEqual(response.body, 'hello b!');
                            return [2 /*return*/];
                    }
                });
            }); });
            (0, node_test_1.test)('logging out with one instance should log out the other instance', function () { return __awaiter(void 0, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, session.inject({
                                method: 'POST',
                                url: '/login-a',
                                payload: { login: 'test', password: 'test' }
                            })];
                        case 1:
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 302);
                            node_assert_1.default.strictEqual(response.headers.location, '/a');
                            return [4 /*yield*/, session.inject({
                                    method: 'POST',
                                    url: '/login-b',
                                    payload: { login: 'test', password: 'test' }
                                })];
                        case 2:
                            // login b
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 302);
                            node_assert_1.default.strictEqual(response.headers.location, '/b');
                            return [4 /*yield*/, session.inject({
                                    method: 'POST',
                                    url: '/logout-a'
                                })];
                        case 3:
                            // logout a
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 401);
                            return [4 /*yield*/, session.inject({
                                    method: 'GET',
                                    url: '/a'
                                })];
                        case 4:
                            // try to access route protected by now logged out instance
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 401);
                            return [4 /*yield*/, session.inject({
                                    method: 'GET',
                                    url: '/b'
                                })];
                        case 5:
                            // access b protected route which should still be logged in
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 200);
                            node_assert_1.default.strictEqual(response.body, 'hello b!');
                            return [2 /*return*/];
                    }
                });
            }); });
            (0, node_test_1.test)('user objects from different instances should be different', function () { return __awaiter(void 0, void 0, void 0, function () {
                var response, userA, userB;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, session.inject({
                                method: 'POST',
                                url: '/login-a',
                                payload: { login: 'test', password: 'test' }
                            })];
                        case 1:
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 302);
                            node_assert_1.default.strictEqual(response.headers.location, '/a');
                            return [4 /*yield*/, session.inject({
                                    method: 'GET',
                                    url: '/user/a'
                                })];
                        case 2:
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 200);
                            userA = JSON.parse(response.body);
                            return [4 /*yield*/, session.inject({
                                    method: 'POST',
                                    url: '/login-b',
                                    payload: { login: 'test', password: 'test' }
                                })];
                        case 3:
                            // login b
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 302);
                            node_assert_1.default.strictEqual(response.headers.location, '/b');
                            return [4 /*yield*/, session.inject({
                                    method: 'GET',
                                    url: '/user/b'
                                })];
                        case 4:
                            response = _a.sent();
                            node_assert_1.default.strictEqual(response.statusCode, 200);
                            userB = JSON.parse(response.body);
                            node_assert_1.default.notStrictEqual(userA.id, userB.id);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
};
testSuite('@fastify/session');
testSuite('@fastify/secure-session');
