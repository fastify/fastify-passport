import { FastifyRequest } from "fastify";
import { SerializeFunction } from "../Authenticator";

/** Class for storing passport data in the session using `fastify-secure-session` */
export class SecureSessionManager {
  key: string;
  serializeUser: SerializeFunction;

  constructor(options: SerializeFunction | any, serializeUser?: SerializeFunction) {
    if (typeof options === "function") {
      serializeUser = options;
      options = undefined;
    }
    options = options || {};

    this.key = options.key || "passport";
    this.serializeUser = serializeUser!;
  }

  logIn(request: FastifyRequest, user: any, cb: (err?: Error) => void) {
    this.serializeUser(user, request)
      .catch(cb)
      .then((obj: any) => {
        if (!request._passport.session) {
          request._passport.session = {};
        }
        request._passport.session.user = obj;
        request.session.set(this.key, request._passport.session);
        cb();
      });
  }

  logOut(request: FastifyRequest, cb?: () => void) {
    if (request._passport && request._passport.session) {
      request.session.set(this.key, undefined);
    }
    if (cb) {
      cb();
    }
  }
}
