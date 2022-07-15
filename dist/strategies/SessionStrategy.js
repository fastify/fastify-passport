"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionStrategy = void 0;
const base_1 = require("./base");
class SessionStrategy extends base_1.Strategy {
    constructor(options, deserializeUser) {
        super('session');
        if (typeof options === 'function') {
            this.deserializeUser = options;
        }
        else if (typeof deserializeUser === 'function') {
            this.deserializeUser = deserializeUser;
        }
        else {
            throw new Error('SessionStrategy#constructor must have a valid deserializeUser-function passed as a parameter');
        }
    }
    authenticate(request, options) {
        if (!request.passport) {
            return this.error(new Error('passport.initialize() plugin not in use'));
        }
        options = options || {};
        if (options.pauseStream) {
            return this.error(new Error("fastify-passport doesn't support pauseStream option."));
        }
        const sessionUser = request.passport.sessionManager.getUserFromSession(request);
        if (sessionUser || sessionUser === 0) {
            void this.deserializeUser(sessionUser, request)
                .catch((err) => this.error(err))
                .then(async (user) => {
                if (!user) {
                    await request.passport.sessionManager.logOut(request);
                }
                else {
                    request[request.passport.userProperty] = user;
                }
                this.pass();
            });
        }
        else {
            this.pass();
        }
    }
}
exports.SessionStrategy = SessionStrategy;
