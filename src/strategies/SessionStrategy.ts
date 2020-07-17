import { FastifyStrategy } from "./base";
import { DeserializeFunction } from "../authenticator";
import type { FastifyRequest } from "fastify";

/**
 * Default strategy that authenticates already-authenticated requests by retrieving their auth information from the Fastify session.
 * */
export class SessionStrategy extends FastifyStrategy {
  private _deserializeUser: DeserializeFunction;

  constructor(deserializeUser: DeserializeFunction);
  constructor(options: any, deserializeUser: DeserializeFunction);
  constructor(options: DeserializeFunction | any, deserializeUser?: DeserializeFunction) {
    super("session");
    if (typeof options === "function") {
      deserializeUser = options;
      options = undefined;
    }
    options = options || {};

    this._deserializeUser = deserializeUser!;
  }

  /**
   * Authenticate request based on the current session state.
   *
   * The session authentication strategy uses the session to restore any login
   * state across requests.  If a login session has been established, `req.user`
   * will be populated with the current user.
   *
   * This strategy is registered automatically by Passport.
   *
   * @param {Object} request
   * @param {Object} options
   * @api protected
   */
  authenticate(request: FastifyRequest, options?: { pauseStream?: boolean }) {
    if (!request._passport) {
      return this.error!(new Error("passport.initialize() plugin not in use"));
    }
    options = options || {};
    // we need this to prevent basic passport's strategies to use unsupported feature.
    if (options.pauseStream) {
      return this.error!(new Error("fastify-passport doesn't support pauseStream option."));
    }

    let sessionUser;
    if (request._passport.session) {
      sessionUser = request._passport.session.user;
    }

    if (sessionUser || sessionUser === 0) {
      this._deserializeUser(sessionUser, request, (err?: Error | null, user?: any) => {
        if (err) {
          return this.error!(err);
        }
        if (!user) {
          delete request._passport.session.user;
        } else {
          // TODO: Remove instance access
          const property = request._passport.instance._userProperty || "user";
          request[property] = user;
        }
        this.pass!();
      });
    } else {
      this.pass!();
    }
  }
}
