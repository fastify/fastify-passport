import { flashFactory } from "fastify-flash/lib/flash";
import { logIn, logOut, isAuthenticated, isUnauthenticated } from "./decorators";
import Authenticator from "./Authenticator";

declare module "fastify" {
  interface FastifyRequest {
    flash: ReturnType<typeof flashFactory>["request"];

    login: typeof logIn;
    logIn: typeof logIn;
    logout: typeof logOut;
    logOut: typeof logOut;
    isAuthenticated: typeof isAuthenticated;
    isUnauthenticated: typeof isUnauthenticated;
    passport: Authenticator;
    user: unknown;
    authInfo: unknown;
    account: unknown;
  }

  interface FastifyReply {
    flash: ReturnType<typeof flashFactory>["reply"];
  }
}
