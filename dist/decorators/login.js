"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logIn = void 0;
async function logIn(user, options = {}) {
    if (!this.passport) {
        throw new Error('passport.initialize() plugin not in use');
    }
    const property = this.passport.userProperty;
    const session = options.session === undefined ? true : options.session;
    this[property] = user;
    if (session) {
        try {
            await this.passport.sessionManager.logIn(this, user);
        }
        catch (e) {
            this[property] = null;
            throw e;
        }
    }
}
exports.logIn = logIn;
