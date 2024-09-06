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
var csrf_protection_1 = require("@fastify/csrf-protection");
function createServer(sessionPluginName) {
    var _this = this;
    var _a = (0, helpers_1.getConfiguredTestServer)(), server = _a.server, fastifyPassport = _a.fastifyPassport;
    void server.register(csrf_protection_1.default, { sessionPlugin: sessionPluginName });
    server.post('/login', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, 'success'];
    }); }); });
    server.get('/csrf', function (_req, reply) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, reply.generateCsrf()];
        });
    }); });
    server.get('/session', function (req) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, req.session.get('_csrf')];
        });
    }); });
    return server;
}
var testSuite = function (sessionPluginName) {
    process.env.SESSION_PLUGIN = sessionPluginName;
    var server = createServer(sessionPluginName);
    (0, node_test_1.describe)("".concat(sessionPluginName, " tests"), function () {
        (0, node_test_1.describe)('guard against fixation', function () {
            var user;
            (0, node_test_1.beforeEach)(function () {
                user = new helpers_1.TestBrowserSession(server);
            });
            (0, node_test_1.test)("should renegerate csrf token on login", function () { return __awaiter(void 0, void 0, void 0, function () {
                var sess, sess, sess;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, user.inject({ method: 'GET', url: '/session' })];
                        case 1:
                            sess = _a.sent();
                            node_assert_1.default.equal(sess.body, '');
                            return [4 /*yield*/, user.inject({ method: 'GET', url: '/csrf' })];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, user.inject({ method: 'GET', url: '/session' })];
                        case 3:
                            sess = _a.sent();
                            node_assert_1.default.notEqual(sess.body, '');
                            return [4 /*yield*/, user.inject({
                                    method: 'POST',
                                    url: '/login',
                                    payload: { login: 'test', password: 'test' }
                                })];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, user.inject({ method: 'GET', url: '/session' })];
                        case 5:
                            sess = _a.sent();
                            node_assert_1.default.equal(sess.body, '');
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
