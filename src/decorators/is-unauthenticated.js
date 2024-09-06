"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUnauthenticated = isUnauthenticated;
function isUnauthenticated() {
    return !this.isAuthenticated();
}
