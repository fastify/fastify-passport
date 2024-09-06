"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = isAuthenticated;
function isAuthenticated() {
    var property = this.passport.userProperty;
    return this[property] ? true : false;
}
