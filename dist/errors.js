"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AuthenticationError extends Error {
    constructor(message, status) {
        super();
        Error.captureStackTrace(this, this.constructor);
        this.name = 'AuthenticationError';
        this.message = message;
        this.status = status || 401;
    }
}
exports.default = AuthenticationError;
