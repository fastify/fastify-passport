"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logOut = void 0;
async function logOut() {
    const property = this.passport.userProperty;
    this[property] = null;
    await this.passport.sessionManager.logOut(this);
}
exports.logOut = logOut;
