"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Strategy = void 0;
class Strategy {
    constructor(name) {
        this.name = name;
    }
    authenticate() {
        throw new Error('Strategy#authenticate must be overridden by subclass');
    }
}
exports.Strategy = Strategy;
