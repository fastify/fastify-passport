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
var got_1 = require("got");
var Authenticator_1 = require("../src/Authenticator");
var strategies_1 = require("../src/strategies");
var helpers_1 = require("./helpers");
var testSuite = function (sessionPluginName) {
    (0, node_test_1.describe)("".concat(sessionPluginName, " tests"), function () {
        (0, node_test_1.test)("should return 401 Unauthorized if not logged in", function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, server, fastifyPassport, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, helpers_1.getConfiguredTestServer)(), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, 'hello world!'];
                        }); }); });
                        server.post('/login', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, function () { });
                        return [4 /*yield*/, server.inject({ method: 'GET', url: '/' })];
                    case 1:
                        response = _b.sent();
                        node_assert_1.default.strictEqual(response.body, 'Unauthorized');
                        node_assert_1.default.strictEqual(response.statusCode, 401);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)("should allow login, and add successMessage to session upon logged in", function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, server, fastifyPassport, loginResponse, homeResponse;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, helpers_1.getConfiguredTestServer)('test', new helpers_1.TestStrategy('test'), null, {
                            clearSessionIgnoreFields: ['messages']
                        }), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, function (request, reply) { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                void reply.send(request.session.get('messages'));
                                return [2 /*return*/];
                            });
                        }); });
                        server.post('/login', {
                            preValidation: fastifyPassport.authenticate('test', {
                                successRedirect: '/',
                                successMessage: 'welcome',
                                authInfo: false
                            })
                        }, function () { });
                        return [4 /*yield*/, server.inject({
                                method: 'POST',
                                url: '/login',
                                payload: { login: 'test', password: 'test' }
                            })];
                    case 1:
                        loginResponse = _b.sent();
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
                        homeResponse = _b.sent();
                        node_assert_1.default.strictEqual(homeResponse.body, '["welcome"]');
                        node_assert_1.default.strictEqual(homeResponse.statusCode, 200);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)("should allow login, and add successMessage to the session from a strategy that sets it", function () { return __awaiter(void 0, void 0, void 0, function () {
            var WelcomeStrategy, _a, server, fastifyPassport, login, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        WelcomeStrategy = /** @class */ (function (_super) {
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
                        _a = (0, helpers_1.getConfiguredTestServer)('test', new WelcomeStrategy('test'), null, {
                            clearSessionIgnoreFields: ['messages']
                        }), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', {
                            preValidation: fastifyPassport.authenticate('test', { authInfo: false })
                        }, function (request) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, request.session.get('messages')];
                        }); }); });
                        server.post('/login', {
                            preValidation: fastifyPassport.authenticate('test', {
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
        (0, node_test_1.test)("should throw error if pauseStream is being used", function () { return __awaiter(void 0, void 0, void 0, function () {
            var fastifyPassport, server, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fastifyPassport = new Authenticator_1.default({ clearSessionIgnoreFields: ['messages'] });
                        fastifyPassport.use('test', new helpers_1.TestStrategy('test'));
                        fastifyPassport.registerUserSerializer(function (user) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, JSON.stringify(user)];
                        }); }); });
                        fastifyPassport.registerUserDeserializer(function (serialized) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, JSON.parse(serialized)];
                        }); }); });
                        server = (0, helpers_1.getTestServer)();
                        void server.register(fastifyPassport.initialize());
                        void server.register(fastifyPassport.secureSession({
                            pauseStream: true
                        }));
                        server.get('/', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, function (request) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, request.session.get('messages')];
                        }); }); });
                        server.post('/login', {
                            preValidation: fastifyPassport.authenticate('test', {
                                successRedirect: '/',
                                successMessage: 'welcome',
                                authInfo: false
                            })
                        }, function () { });
                        return [4 /*yield*/, server.inject({
                                method: 'POST',
                                payload: { login: 'test', password: 'test' },
                                url: '/login'
                            })];
                    case 1:
                        response = _a.sent();
                        node_assert_1.default.strictEqual(response.statusCode, 500);
                        return [4 /*yield*/, server.inject({
                                url: '/',
                                method: 'GET'
                            })];
                    case 2:
                        response = _a.sent();
                        node_assert_1.default.strictEqual(response.statusCode, 500);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)("should execute successFlash if logged in", function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, server, fastifyPassport, login, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, helpers_1.getConfiguredTestServer)('test', new helpers_1.TestStrategy('test'), null, {
                            clearSessionIgnoreFields: ['flash']
                        }), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, function (request, reply) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, reply.flash('success')];
                        }); }); });
                        server.post('/login', {
                            preValidation: fastifyPassport.authenticate('test', {
                                successRedirect: '/',
                                successFlash: 'welcome',
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
                        node_assert_1.default.strictEqual(response.body, '["welcome"]');
                        node_assert_1.default.strictEqual(response.statusCode, 200);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)("should execute successFlash=true if logged in", function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, server, fastifyPassport, login, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, helpers_1.getConfiguredTestServer)(), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, function (request, reply) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, reply.flash('success')];
                        }); }); });
                        server.post('/login', {
                            preValidation: fastifyPassport.authenticate('test', {
                                successRedirect: '/',
                                successFlash: true,
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
                        node_assert_1.default.strictEqual(response.body, '[]');
                        node_assert_1.default.strictEqual(response.statusCode, 200);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)("should return 200 if logged in and redirect to the successRedirect from options", function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, server, fastifyPassport, login, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, helpers_1.getConfiguredTestServer)(), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, 'hello world!'];
                        }); }); });
                        server.post('/login', { preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: false }) }, function () { });
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
                                url: String(login.headers.location),
                                headers: {
                                    cookie: login.headers['set-cookie']
                                },
                                method: 'GET'
                            })];
                    case 2:
                        response = _b.sent();
                        node_assert_1.default.strictEqual(response.body, 'hello world!');
                        node_assert_1.default.strictEqual(response.statusCode, 200);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)("should return use assignProperty option", function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, server, fastifyPassport, login;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, helpers_1.getConfiguredTestServer)(), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.post('/login', {
                            preValidation: fastifyPassport.authenticate('test', {
                                successRedirect: '/',
                                assignProperty: 'user',
                                authInfo: false
                            })
                        }, function (request, reply) {
                            reply.send(request.user);
                        });
                        return [4 /*yield*/, server.inject({
                                method: 'POST',
                                payload: { login: 'test', password: 'test' },
                                url: '/login'
                            })];
                    case 1:
                        login = _b.sent();
                        node_assert_1.default.strictEqual(JSON.parse(login.body).name, 'test');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)("should redirect to the returnTo set in the session upon login", function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, server, fastifyPassport, login, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, helpers_1.getConfiguredTestServer)('test', new helpers_1.TestStrategy('test'), null, {
                            clearSessionIgnoreFields: ['returnTo']
                        }), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.addHook('preValidation', function (request, _reply) { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                request.session.set('returnTo', '/success');
                                return [2 /*return*/];
                            });
                        }); });
                        server.get('/success', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, 'hello world!'];
                        }); }); });
                        server.post('/login', { preValidation: fastifyPassport.authenticate('test', { successReturnToOrRedirect: '/', authInfo: false }) }, function () { });
                        return [4 /*yield*/, server.inject({
                                method: 'POST',
                                payload: { login: 'test', password: 'test' },
                                url: '/login'
                            })];
                    case 1:
                        login = _b.sent();
                        node_assert_1.default.strictEqual(login.statusCode, 302);
                        node_assert_1.default.strictEqual(login.headers.location, '/success');
                        return [4 /*yield*/, server.inject({
                                url: String(login.headers.location),
                                headers: {
                                    cookie: login.headers['set-cookie']
                                },
                                method: 'GET'
                            })];
                    case 2:
                        response = _b.sent();
                        node_assert_1.default.strictEqual(response.statusCode, 200);
                        node_assert_1.default.strictEqual(response.body, 'hello world!');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)("should return 200 if logged in and authInfo is true", function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, server, fastifyPassport, login, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, helpers_1.getConfiguredTestServer)(), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', { preValidation: fastifyPassport.authenticate('test', { authInfo: true }) }, function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, 'hello world!'];
                        }); }); });
                        server.post('/login', { preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: true }) }, function () { });
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
                        node_assert_1.default.strictEqual(response.body, 'hello world!');
                        node_assert_1.default.strictEqual(response.statusCode, 200);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)("should return 200 if logged in against a running server", function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, server, fastifyPassport, port, login, cookies, home;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, helpers_1.getConfiguredTestServer)(), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', { preValidation: fastifyPassport.authenticate('test', { authInfo: true }) }, function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, 'hello world!'];
                        }); }); });
                        server.post('/login', { preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: true }) }, function () { });
                        return [4 /*yield*/, server.listen()];
                    case 1:
                        _b.sent();
                        server.server.unref();
                        port = server.server.address().port;
                        return [4 /*yield*/, (0, got_1.default)('http://localhost:' + port + '/login', {
                                method: 'POST',
                                json: { login: 'test', password: 'test' },
                                followRedirect: false
                            })];
                    case 2:
                        login = _b.sent();
                        node_assert_1.default.strictEqual(login.statusCode, 302);
                        node_assert_1.default.strictEqual(login.headers.location, '/');
                        cookies = login.headers['set-cookie'];
                        node_assert_1.default.strictEqual(cookies.length, 1);
                        return [4 /*yield*/, (0, got_1.default)({
                                url: 'http://localhost:' + port,
                                headers: {
                                    cookie: cookies[0]
                                },
                                method: 'GET'
                            })];
                    case 3:
                        home = _b.sent();
                        node_assert_1.default.strictEqual(home.statusCode, 200);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)("should execute failureRedirect if failed to log in", function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, server, fastifyPassport, login;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, helpers_1.getConfiguredTestServer)(), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.post('/login', { preValidation: fastifyPassport.authenticate('test', { failureRedirect: '/failure', authInfo: false }) }, function () { });
                        return [4 /*yield*/, server.inject({
                                method: 'POST',
                                payload: { login: 'test1', password: 'test' },
                                url: '/login'
                            })];
                    case 1:
                        login = _b.sent();
                        node_assert_1.default.strictEqual(login.statusCode, 302);
                        node_assert_1.default.strictEqual(login.headers.location, '/failure');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)("should add failureMessage to session if failed to log in", function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, server, fastifyPassport, login, headers, home;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, helpers_1.getConfiguredTestServer)(), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', function (request, reply) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, reply.send(request.session.get('messages'))];
                        }); }); });
                        server.post('/login', {
                            preValidation: fastifyPassport.authenticate('test', {
                                failureMessage: 'try again',
                                authInfo: false
                            })
                        }, function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, 'login page'];
                        }); }); });
                        return [4 /*yield*/, server.inject({
                                method: 'POST',
                                payload: { login: 'not-correct', password: 'test' },
                                url: '/login'
                            })];
                    case 1:
                        login = _b.sent();
                        node_assert_1.default.strictEqual(login.statusCode, 401);
                        headers = {};
                        if (login.headers['set-cookie']) {
                            headers['cookie'] = login.headers['set-cookie'];
                        }
                        return [4 /*yield*/, server.inject({
                                url: '/',
                                headers: headers,
                                method: 'GET'
                            })];
                    case 2:
                        home = _b.sent();
                        node_assert_1.default.strictEqual(home.body, '["try again"]');
                        node_assert_1.default.strictEqual(home.statusCode, 200);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)("should add failureFlash to session if failed to log in", function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, server, fastifyPassport, login, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, helpers_1.getConfiguredTestServer)(), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', function (request, reply) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, reply.flash('error')];
                        }); }); });
                        server.post('/login', {
                            preValidation: fastifyPassport.authenticate('test', {
                                failureFlash: 'try again',
                                authInfo: false
                            })
                        }, function () { });
                        return [4 /*yield*/, server.inject({
                                method: 'POST',
                                payload: { login: 'not-correct', password: 'test' },
                                url: '/login'
                            })];
                    case 1:
                        login = _b.sent();
                        node_assert_1.default.strictEqual(login.statusCode, 401);
                        return [4 /*yield*/, server.inject({
                                url: '/',
                                headers: {
                                    cookie: login.headers['set-cookie']
                                },
                                method: 'GET'
                            })];
                    case 2:
                        response = _b.sent();
                        node_assert_1.default.strictEqual(response.body, '["try again"]');
                        node_assert_1.default.strictEqual(response.statusCode, 200);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)("should add failureFlash=true to session if failed to log in", function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, server, fastifyPassport, login, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, helpers_1.getConfiguredTestServer)(), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', function (request, reply) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, reply.flash('error')];
                        }); }); });
                        server.post('/login', {
                            preValidation: fastifyPassport.authenticate('test', {
                                failureFlash: true,
                                authInfo: false
                            })
                        }, function () { });
                        return [4 /*yield*/, server.inject({
                                method: 'POST',
                                payload: { login: 'not-correct', password: 'test' },
                                url: '/login'
                            })];
                    case 1:
                        login = _b.sent();
                        node_assert_1.default.strictEqual(login.statusCode, 401);
                        return [4 /*yield*/, server.inject({
                                url: '/',
                                method: 'GET'
                            })];
                    case 2:
                        response = _b.sent();
                        node_assert_1.default.strictEqual(response.statusCode, 200);
                        node_assert_1.default.strictEqual(response.body, '[]');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)("should return 401 Unauthorized if not logged in when used as a handler", function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, server, fastifyPassport, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, helpers_1.getConfiguredTestServer)(), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, 'hello world!'];
                        }); }); });
                        server.post('/login', fastifyPassport.authenticate('test', { authInfo: false, successRedirect: '/' }));
                        return [4 /*yield*/, server.inject({ method: 'GET', url: '/' })];
                    case 1:
                        response = _b.sent();
                        node_assert_1.default.strictEqual(response.body, 'Unauthorized');
                        node_assert_1.default.strictEqual(response.statusCode, 401);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)("should redirect when used as a handler", function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, server, fastifyPassport, login, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, helpers_1.getConfiguredTestServer)(), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', { preValidation: fastifyPassport.authenticate('test', { authInfo: true }) }, function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, 'hello world!'];
                        }); }); });
                        server.post('/login', fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: true }));
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
                        node_assert_1.default.strictEqual(response.body, 'hello world!');
                        node_assert_1.default.strictEqual(response.statusCode, 200);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)("should not log the user in when passed a callback", function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, server, fastifyPassport, login, headers, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, helpers_1.getConfiguredTestServer)(), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', { preValidation: fastifyPassport.authenticate('test', { authInfo: true }) }, function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, 'hello world!'];
                        }); }); });
                        server.post('/login', fastifyPassport.authenticate('test', function (request, reply, err, user) { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, user.name];
                            });
                        }); }));
                        return [4 /*yield*/, server.inject({
                                method: 'POST',
                                payload: { login: 'test', password: 'test' },
                                url: '/login'
                            })];
                    case 1:
                        login = _b.sent();
                        node_assert_1.default.strictEqual(login.statusCode, 200);
                        node_assert_1.default.strictEqual(login.body, 'test');
                        headers = {};
                        if (login.headers['set-cookie']) {
                            headers['cookie'] = login.headers['set-cookie'];
                        }
                        return [4 /*yield*/, server.inject({
                                url: '/',
                                headers: headers,
                                method: 'GET'
                            })];
                    case 2:
                        response = _b.sent();
                        node_assert_1.default.strictEqual(response.statusCode, 401);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)("should allow registering strategies after creating routes referring to those strategies by name", function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, server, fastifyPassport, loginResponse, homeResponse;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, helpers_1.getRegisteredTestServer)(null, { clearSessionIgnoreFields: ['messages'] }), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, function (request, reply) { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                void reply.send(request.session.get('messages'));
                                return [2 /*return*/];
                            });
                        }); });
                        server.post('/login', {
                            preValidation: fastifyPassport.authenticate('test', {
                                successRedirect: '/',
                                successMessage: 'welcome',
                                authInfo: false
                            })
                        }, function () { });
                        // register the test strategy late (after the above .authenticate calls)
                        fastifyPassport.use(new helpers_1.TestStrategy('test'));
                        return [4 /*yield*/, server.inject({
                                method: 'POST',
                                url: '/login',
                                payload: { login: 'test', password: 'test' }
                            })];
                    case 1:
                        loginResponse = _b.sent();
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
                        homeResponse = _b.sent();
                        node_assert_1.default.strictEqual(homeResponse.body, '["welcome"]');
                        node_assert_1.default.strictEqual(homeResponse.statusCode, 200);
                        return [2 /*return*/];
                }
            });
        }); });
    });
};
testSuite('@fastify/session');
testSuite('@fastify/secure-session');
