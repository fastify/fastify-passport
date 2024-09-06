"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-floating-promises */
var node_test_1 = require("node:test");
var node_assert_1 = require("node:assert");
var SessionStrategy_1 = require("../src/strategies/SessionStrategy");
(0, node_test_1.describe)('SessionStrategy', function () {
    (0, node_test_1.test)('should throw an Error if no parameter was passed', function () {
        node_assert_1.default.throws(
        // @ts-expect-error.strictEqual-error expecting atleast a parameter
        function () { return new SessionStrategy_1.SessionStrategy(); }, function (err) {
            (0, node_assert_1.default)(err instanceof Error);
            node_assert_1.default.strictEqual(err.message, 'SessionStrategy#constructor must have a valid deserializeUser-function passed as a parameter');
            return true;
        });
    });
    (0, node_test_1.test)('should throw an Error if no deserializeUser-function was passed as second parameter', function () {
        node_assert_1.default.throws(
        // @ts-expect-error.strictEqual-error expecting a function as second parameter
        function () { return new SessionStrategy_1.SessionStrategy({}); }, function (err) {
            (0, node_assert_1.default)(err instanceof Error);
            node_assert_1.default.strictEqual(err.message, 'SessionStrategy#constructor must have a valid deserializeUser-function passed as a parameter');
            return true;
        });
    });
    (0, node_test_1.test)('should throw an Error if no deserializeUser-function was passed as second parameter', function () {
        node_assert_1.default.throws(
        // @ts-expect-error.strictEqual-error expecting a function as second parameter
        function () { return new SessionStrategy_1.SessionStrategy({}); }, function (err) {
            (0, node_assert_1.default)(err instanceof Error);
            node_assert_1.default.strictEqual(err.message, 'SessionStrategy#constructor must have a valid deserializeUser-function passed as a parameter');
            return true;
        });
    });
    (0, node_test_1.test)('should not throw an Error if no deserializeUser-function was passed as first parameter', function () {
        node_assert_1.default.doesNotThrow(function () { return new SessionStrategy_1.SessionStrategy((function (id) { return id; })); });
    });
    (0, node_test_1.test)('should not throw an Error if no deserializeUser-function was passed as second parameter', function () {
        node_assert_1.default.doesNotThrow(function () { return new SessionStrategy_1.SessionStrategy({}, (function (id) { return id; })); });
    });
});
