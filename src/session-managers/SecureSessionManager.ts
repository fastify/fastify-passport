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

  async logIn(request: FastifyRequest, user: any) {
    const object = await this.serializeUser(user, request);
    if (!request._passport.session) {
      request._passport.session = {};
    }
    request._passport.session.user = object;
    request.session.set(this.key, request._passport.session);
  }

  async logOut(request: FastifyRequest) {
    if (request._passport && request._passport.session) {
      request.session.set(this.key, undefined);
    }
  }
}
