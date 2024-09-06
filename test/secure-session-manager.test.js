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
var SecureSessionManager_1 = require("../src/session-managers/SecureSessionManager");
(0, node_test_1.describe)('SecureSessionManager', function () {
    (0, node_test_1.test)('should throw an Error if no parameter was passed', function () {
        node_assert_1.default.throws(
        // @ts-expect-error - strictEqual-error expecting atleast a parameter
        function () { return new SecureSessionManager_1.SecureSessionManager(); }, function (err) {
            (0, node_assert_1.default)(err instanceof Error);
            node_assert_1.default.strictEqual(err.message, 'SecureSessionManager#constructor must have a valid serializeUser-function passed as a parameter');
            return true;
        });
    });
    (0, node_test_1.test)('should throw an Error if no serializeUser-function was passed as second parameter', function () {
        node_assert_1.default.throws(
        // @ts-expect-error - strictEqual-error expecting a function as second parameter
        function () { return new SecureSessionManager_1.SecureSessionManager({}); }, function (err) {
            (0, node_assert_1.default)(err instanceof Error);
            node_assert_1.default.strictEqual(err.message, 'SecureSessionManager#constructor must have a valid serializeUser-function passed as a parameter');
            return true;
        });
    });
    (0, node_test_1.test)('should throw an Error if no serializeUser-function was passed as second parameter', function () {
        node_assert_1.default.throws(
        // @ts-expect-error - strictEqual-error expecting a function as second parameter
        function () { return new SecureSessionManager_1.SecureSessionManager({}); }, function (err) {
            (0, node_assert_1.default)(err instanceof Error);
            node_assert_1.default.strictEqual(err.message, 'SecureSessionManager#constructor must have a valid serializeUser-function passed as a parameter');
            return true;
        });
    });
    (0, node_test_1.test)('should not throw an Error if no serializeUser-function was passed as first parameter', function () {
        var sessionManager = new SecureSessionManager_1.SecureSessionManager((function (id) { return id; }));
        node_assert_1.default.strictEqual(sessionManager.key, 'passport');
    });
    (0, node_test_1.test)('should not throw an Error if no serializeUser-function was passed as second parameter', function () {
        var sessionManager = new SecureSessionManager_1.SecureSessionManager({}, (function (id) { return id; }));
        node_assert_1.default.strictEqual(sessionManager.key, 'passport');
    });
    (0, node_test_1.test)('should set the key accordingly', function () {
        var sessionManager = new SecureSessionManager_1.SecureSessionManager({ key: 'test' }, (function (id) { return id; }));
        node_assert_1.default.strictEqual(sessionManager.key, 'test');
    });
    (0, node_test_1.test)('should ignore non-string keys', function () {
        // @ts-expect-error - strictEqual-error key has to be of type string
        var sessionManager = new SecureSessionManager_1.SecureSessionManager({ key: 1 }, (function (id) { return id; }));
        node_assert_1.default.strictEqual(sessionManager.key, 'passport');
    });
    (0, node_test_1.test)('should only call request.session.regenerate once if a function', function () { return __awaiter(void 0, void 0, void 0, function () {
        var sessionManger, user, request;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sessionManger = new SecureSessionManager_1.SecureSessionManager({}, (function (id) { return id; }));
                    user = { id: 'test' };
                    request = {
                        session: { regenerate: node_test_1.mock.fn(function () { }), set: function () { }, data: function () { } }
                    };
                    return [4 /*yield*/, sessionManger.logIn(request, user)
                        // @ts-expect-error - regenerate is a mock function
                    ];
                case 1:
                    _a.sent();
                    // @ts-expect-error - regenerate is a mock function
                    node_assert_1.default.strictEqual(request.session.regenerate.mock.callCount(), 1);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, node_test_1.test)('should call request.session.regenerate function if clearSessionOnLogin is false', function () { return __awaiter(void 0, void 0, void 0, function () {
        var sessionManger, user, request;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sessionManger = new SecureSessionManager_1.SecureSessionManager({ clearSessionOnLogin: false }, (function (id) { return id; }));
                    user = { id: 'test' };
                    request = {
                        session: { regenerate: node_test_1.mock.fn(function () { }), set: function () { }, data: function () { } }
                    };
                    return [4 /*yield*/, sessionManger.logIn(request, user)
                        // @ts-expect-error - regenerate is a mock function
                    ];
                case 1:
                    _a.sent();
                    // @ts-expect-error - regenerate is a mock function
                    node_assert_1.default.strictEqual(request.session.regenerate.mock.callCount(), 1);
                    node_test_1.mock.reset();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, node_test_1.test)('should call request.session.regenerate function with all properties from session if keepSessionInfo is true', function () { return __awaiter(void 0, void 0, void 0, function () {
        var sessionManger, user, request;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sessionManger = new SecureSessionManager_1.SecureSessionManager({ clearSessionOnLogin: true }, (function (id) { return id; }));
                    user = { id: 'test' };
                    request = {
                        session: { regenerate: node_test_1.mock.fn(function () { }), set: function () { }, data: function () { }, sessionValue: 'exist' }
                    };
                    return [4 /*yield*/, sessionManger.logIn(request, user, { keepSessionInfo: true })
                        // @ts-expect-error - regenerate is a mock function
                    ];
                case 1:
                    _a.sent();
                    // @ts-expect-error - regenerate is a mock function
                    node_assert_1.default.strictEqual(request.session.regenerate.mock.callCount(), 1);
                    // @ts-expect-error - regenerate is a mock function
                    node_assert_1.default.deepStrictEqual(request.session.regenerate.mock.calls[0].arguments, [
                        ['session', 'regenerate', 'set', 'data', 'sessionValue']
                    ]);
                    node_test_1.mock.reset();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, node_test_1.test)('should call request.session.regenerate function with default properties from session if keepSessionInfo is false', function () { return __awaiter(void 0, void 0, void 0, function () {
        var sessionManger, user, request;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sessionManger = new SecureSessionManager_1.SecureSessionManager({ clearSessionOnLogin: true }, (function (id) { return id; }));
                    user = { id: 'test' };
                    request = {
                        session: { regenerate: node_test_1.mock.fn(function () { }), set: function () { }, data: function () { }, sessionValue: 'exist' }
                    };
                    return [4 /*yield*/, sessionManger.logIn(request, user, { keepSessionInfo: false })
                        // @ts-expect-error - regenerate is a mock function
                    ];
                case 1:
                    _a.sent();
                    // @ts-expect-error - regenerate is a mock function
                    node_assert_1.default.strictEqual(request.session.regenerate.mock.callCount(), 1);
                    // @ts-expect-error - regenerate is a mock function
                    node_assert_1.default.deepStrictEqual(request.session.regenerate.mock.calls[0].arguments, [['session']]);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, node_test_1.test)('should call session.set function if no regenerate function provided and keepSessionInfo is true', function () { return __awaiter(void 0, void 0, void 0, function () {
        var sessionManger, user, set, request;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sessionManger = new SecureSessionManager_1.SecureSessionManager({ clearSessionOnLogin: true }, (function (id) { return id; }));
                    user = { id: 'test' };
                    set = node_test_1.mock.fn();
                    request = {
                        session: { set: set, data: function () { }, sessionValue: 'exist' }
                    };
                    return [4 /*yield*/, sessionManger.logIn(request, user, { keepSessionInfo: false })];
                case 1:
                    _a.sent();
                    node_assert_1.default.strictEqual(set.mock.callCount(), 1);
                    node_assert_1.default.deepStrictEqual(set.mock.calls[0].arguments, ['passport', { id: 'test' }]);
                    return [2 /*return*/];
            }
        });
    }); });
});
