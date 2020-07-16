import fs from "fs";
import requestCallback from "request";
import fastify from "fastify";
import fastifySecureSession from "fastify-secure-session";
import Authenticator from "../src/authenticator";
import { FastifyStrategy } from "../src/strategies";

export const expectAsyncThrow = async (fn: () => Promise<void>) => {
  let error = null;
  try {
    await fn();
  } catch (e) {
    error = e;
  }

  if (!error) {
    fail("no error thrown in async function");
  }
};

const SecretKey = fs.readFileSync(__dirname + "/secure.key");

export class TestStrategy extends FastifyStrategy {
  authenticate(request: any, _options?: { pauseStream?: boolean }) {
    if (request.isAuthenticated()) {
      return this.pass!();
    }
    if (request.body && request.body.login === "test" && request.body.password === "test") {
      return this.success!({ name: "test" });
    }
    this.fail!();
  }
}

export const getTestServer = () => {
  const server = fastify();
  server.register(fastifySecureSession, { key: SecretKey });
  return server;
};

export const request = (options): Promise<{ response: any; body: any }> => {
  return new Promise((resolve, reject) => {
    requestCallback(options, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        resolve({ response, body });
      }
    });
  });
};

export const getConfiguredTestServer = (name = "test", strategy = new TestStrategy("test")) => {
  const fastifyPassport = new Authenticator();
  fastifyPassport.use(name, strategy);
  fastifyPassport.serializeUser((user, done) => {
    done(null, JSON.stringify(user));
  });
  fastifyPassport.deserializeUser((user, done) => {
    done(null, user);
  });

  const server = getTestServer();
  server.register(fastifyPassport.initialize());
  server.register(fastifyPassport.secureSession());

  return { fastifyPassport, server };
};
