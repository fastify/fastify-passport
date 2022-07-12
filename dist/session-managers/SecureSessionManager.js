"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureSessionManager = void 0;
class SecureSessionManager {
    constructor(options, serializeUser) {
        if (typeof options === 'function') {
            serializeUser = options;
            options = undefined;
        }
        options = options || {};
        this.key = options.key || 'passport';
        this.serializeUser = serializeUser;
    }
    async logIn(request, user) {
        const object = await this.serializeUser(user, request);
        request.session.set(this.key, object);
    }
    async logOut(request) {
        request.session.set(this.key, undefined);
    }
    getUserFromSession(request) {
        return request.session.get(this.key);
    }
}
exports.SecureSessionManager = SecureSessionManager;
