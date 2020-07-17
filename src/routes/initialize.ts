import fp from "fastify-plugin";
import { logIn, logOut, isAuthenticated, isUnauthenticated } from "../decorators";
import Authenticator from "../Authenticator";
import { FastifyRequest } from "fastify";
import flash from "fastify-flash";

export default function initializeFactory(passport: Authenticator, options: { userProperty?: string } = {}) {
  const preValidator = async (request: FastifyRequest) => {
    const sessionKey = request._passport.instance._key;
    request._passport.session = request.session.get(sessionKey);
  };

  return fp(async (fastify) => {
    fastify.register(flash);
    fastify.decorateRequest("_passport", { instance: passport });
    fastify.addHook("preValidation", preValidator);
    fastify.decorateRequest("logIn", logIn);
    fastify.decorateRequest("login", logIn);
    fastify.decorateRequest("logOut", logOut);
    fastify.decorateRequest("logout", logOut);
    fastify.decorateRequest("isAuthenticated", isAuthenticated);
    fastify.decorateRequest("isUnauthenticated", isUnauthenticated);
    fastify.decorateRequest(options.userProperty || "user", null);
  });
}
