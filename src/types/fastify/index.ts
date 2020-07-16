import "fastify";
import { logIn } from "../../decorators/login";
import { logOut } from "../../decorators/logout";
import { isAuthenticated } from "../../decorators/is-authenticated";
import { isUnauthenticated } from "../../decorators/is-unauthenticated";
import { flashFactory } from "fastify-flash/lib/flash";

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
