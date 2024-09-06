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
var passport_facebook_1 = require("passport-facebook");
var passport_github2_1 = require("passport-github2");
var passport_google_oauth_1 = require("passport-google-oauth");
var openid_client_1 = require("openid-client");
var helpers_1 = require("./helpers");
var testSuite = function (sessionPluginName) {
    (0, node_test_1.describe)("".concat(sessionPluginName, " tests"), function () {
        (0, node_test_1.test)('should initiate oauth with the google strategy from npm', function () { return __awaiter(void 0, void 0, void 0, function () {
            var strategy, _a, server, fastifyPassport, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        strategy = new passport_google_oauth_1.OAuth2Strategy({
                            clientID: '384163122467-cq6dolrp53at1a3pa8j0f4stpa5gvouh.apps.googleusercontent.com',
                            clientSecret: 'o15Chw0KIaXtx_2wRGxNdNSy',
                            callbackURL: 'http://www.example.com/auth/google/callback'
                        }, function () { return (0, node_assert_1.fail)(); });
                        _a = (0, helpers_1.getConfiguredTestServer)('google', strategy), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', { preValidation: fastifyPassport.authenticate('google', { authInfo: false }) }, function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, 'hello world!'];
                        }); }); });
                        server.post('/login', { preValidation: fastifyPassport.authenticate('google', { authInfo: false }) }, function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, 'hello'];
                        }); }); });
                        return [4 /*yield*/, server.inject({ method: 'GET', url: '/' })];
                    case 1:
                        response = _b.sent();
                        node_assert_1.default.strictEqual(response.statusCode, 302);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)('should initiate oauth with the facebook strategy from npm', function () { return __awaiter(void 0, void 0, void 0, function () {
            var strategy, _a, server, fastifyPassport, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        strategy = new passport_facebook_1.Strategy({
                            clientID: 'foobar',
                            clientSecret: 'baz',
                            callbackURL: 'http://www.example.com/auth/facebook/callback'
                        }, function () { return (0, node_assert_1.fail)(); });
                        _a = (0, helpers_1.getConfiguredTestServer)('facebook', strategy), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', { preValidation: fastifyPassport.authenticate('facebook', { authInfo: false }) }, function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, 'hello world!'];
                        }); }); });
                        server.post('/login', { preValidation: fastifyPassport.authenticate('facebook', { authInfo: false }) }, function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, 'hello'];
                        }); }); });
                        return [4 /*yield*/, server.inject({ method: 'GET', url: '/' })];
                    case 1:
                        response = _b.sent();
                        node_assert_1.default.strictEqual(response.statusCode, 302);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)('should initiate oauth with the github strategy from npm', function () { return __awaiter(void 0, void 0, void 0, function () {
            var strategy, _a, server, fastifyPassport, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        strategy = new passport_github2_1.Strategy({
                            clientID: 'foobar',
                            clientSecret: 'baz',
                            callbackURL: 'http://www.example.com/auth/facebook/callback'
                        }, function () { return (0, node_assert_1.fail)(); });
                        _a = (0, helpers_1.getConfiguredTestServer)('github', strategy), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', { preValidation: fastifyPassport.authenticate('github', { authInfo: false }) }, function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, 'hello world!'];
                        }); }); });
                        server.post('/login', { preValidation: fastifyPassport.authenticate('github', { authInfo: false }) }, function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, 'hello'];
                        }); }); });
                        return [4 /*yield*/, server.inject({ method: 'GET', url: '/' })];
                    case 1:
                        response = _b.sent();
                        node_assert_1.default.strictEqual(response.statusCode, 302);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, node_test_1.test)('should initiate oauth with the openid-client strategy from npm', function () { return __awaiter(void 0, void 0, void 0, function () {
            var issuer, client, strategy, _a, server, fastifyPassport, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        issuer = new openid_client_1.Issuer({ issuer: 'test_issuer', authorization_endpoint: 'http://www.example.com' });
                        client = new issuer.Client({
                            client_id: 'identifier',
                            client_secret: 'secure',
                            redirect_uris: ['http://www.example.com/auth/openid-client/callback']
                        });
                        strategy = new openid_client_1.Strategy({
                            client: client
                        }, function () { return (0, node_assert_1.fail)(); });
                        _a = (0, helpers_1.getConfiguredTestServer)('openid-client', strategy), server = _a.server, fastifyPassport = _a.fastifyPassport;
                        server.get('/', { preValidation: fastifyPassport.authenticate('openid-client', { authInfo: false }) }, function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, 'hello world!'];
                        }); }); });
                        server.post('/login', { preValidation: fastifyPassport.authenticate('openid-client', { authInfo: false }) }, function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, 'hello'];
                        }); }); });
                        return [4 /*yield*/, server.inject({ method: 'GET', url: '/' })];
                    case 1:
                        response = _b.sent();
                        node_assert_1.default.strictEqual(response.statusCode, 302);
                        return [2 /*return*/];
                }
            });
        }); });
    });
};
testSuite('@fastify/session');
testSuite('@fastify/secure-session');
