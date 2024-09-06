"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Strategy = void 0;
var Strategy = /** @class */ (function () {
    function Strategy(name) {
        this.name = name;
    }
    Strategy.prototype.authenticate = function () {
        throw new Error('Strategy#authenticate must be overridden by subclass');
    };
    return Strategy;
}());
exports.Strategy = Strategy;
