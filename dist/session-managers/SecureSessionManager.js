"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureSessionManager = void 0;
class SecureSessionManager {
    constructor(options, serializeUser) {
        if (typeof options === 'function') {
            this.serializeUser = options;
            this.key = 'passport';
        }
        else if (typeof serializeUser === 'function') {
            this.serializeUser = serializeUser;
            this.key =
                (options && typeof options === 'object' && typeof options.key === 'string' && options.key) || 'passport';
        }
        else {
            throw new Error('SecureSessionManager#constructor must have a valid serializeUser-function passed as a parameter');
        }
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
