"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-floating-promises */
var node_test_1 = require("node:test");
var node_assert_1 = require("node:assert");
var node_child_process_1 = require("node:child_process");
var node_path_1 = require("node:path");
(0, node_test_1.describe)('Native ESM import', function () {
    (0, node_test_1.test)('should be able to use default export', function () {
        var status = (0, node_child_process_1.spawnSync)('node', [(0, node_path_1.join)(__dirname, '../../../test/esm', 'default-esm-export.mjs')]).status;
        node_assert_1.default.strictEqual(status, 0);
    });
    (0, node_test_1.test)('should be able to use named export', function () {
        var status = (0, node_child_process_1.spawnSync)('node', [(0, node_path_1.join)(__dirname, '../../../test/esm', 'named-esm-export.mjs')]).status;
        node_assert_1.default.strictEqual(status, 0);
    });
});
