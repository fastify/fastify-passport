"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = void 0;
function isAuthenticated() {
    const property = this.passport.userProperty;
    return this[property] ? true : false;
}
exports.isAuthenticated = isAuthenticated;
