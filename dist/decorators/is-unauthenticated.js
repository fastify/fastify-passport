"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUnauthenticated = void 0;
function isUnauthenticated() {
    return !this.isAuthenticated();
}
exports.isUnauthenticated = isUnauthenticated;
