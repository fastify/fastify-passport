import { flashFactory } from "fastify-flash/lib/flash";
import { logIn, logOut, isAuthenticated, isUnauthenticated } from "./decorators";

declare module "fastify" {
  interface FastifyRequest {
    flash: ReturnType<typeof flashFactory>["request"];

    login: typeof logIn;
    logIn: typeof logIn;
    logout: typeof logOut;
    logOut: typeof logOut;
    isAuthenticated: typeof isAuthenticated;
    isUnauthenticated: typeof isUnauthenticated;
    _passport: {
      instance: any;
      session?: any;
    };
    user: any;
    authInfo: any;
    account: any;
  }

  interface FastifyReply {
    flash: ReturnType<typeof flashFactory>["reply"];
  }
}
