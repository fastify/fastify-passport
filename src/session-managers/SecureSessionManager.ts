import { FastifyRequest } from "fastify";
import { SerializeFunction } from "../authenticator";

/** Class for storing passport data in the session using `fastify-secure-session` */
export class SecureSessionManager {
  _key: string;
  _serializeUser: SerializeFunction;

  constructor(options: SerializeFunction | any, serializeUser?: SerializeFunction) {
    if (typeof options === "function") {
      serializeUser = options;
      options = undefined;
    }
    options = options || {};

    this._key = options.key || "passport";
    this._serializeUser = serializeUser!;
  }

  logIn(request: FastifyRequest, user: any, cb: (err?: Error) => void) {
    this._serializeUser(user, request, (err: Error, obj: any) => {
      if (err) {
        return cb(err);
      }
      if (!request._passport.session) {
        request._passport.session = {};
      }
      request._passport.session.user = obj;
      request.session.set(this._key, request._passport.session);
      cb();
    });
  }

  logOut(request: FastifyRequest, cb?: () => void) {
    if (request._passport && request._passport.session) {
      request.session.set(this._key, undefined);
    }
    if (cb) {
      cb();
    }
  }
}
