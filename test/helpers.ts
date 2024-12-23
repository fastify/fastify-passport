import fs from 'node:fs';
import { join } from 'node:path';
import fastify, { FastifyInstance } from 'fastify';
import fastifySecureSession, { SecureSessionPluginOptions } from '@fastify/secure-session';
import fastifyCookie from '@fastify/cookie';
import Authenticator, { AuthenticatorOptions } from '../src/Authenticator';
import { Strategy } from '../src/strategies';
import { InjectOptions, Response as LightMyRequestResponse } from 'light-my-request';
import parseCookies from 'set-cookie-parser';
import { IncomingMessage } from 'node:http';
import { FastifyRegisterOptions } from 'fastify/types/register';
import { fastifySession, FastifySessionOptions } from '@fastify/session';

const SecretKey = fs.readFileSync(join(__dirname, '../../test', 'secure.key'));

let counter = 0;
export const generateTestUser = () => ({ name: 'test', id: String(counter++) });

export class TestStrategy extends Strategy {
  authenticate (request: any, _options?: { pauseStream?: boolean }) {
    if (request.isAuthenticated()) {
      return this.pass();
    }
    if (request.body && request.body.login === 'test' && request.body.password === 'test') {
      return this.success(generateTestUser());
    }

    this.fail();
  }
}

export class TestDatabaseStrategy extends Strategy {
  constructor (
    name: string,
    readonly database: Record<string, { id: string; login: string; password: string }> = {}
  ) {
    super(name);
  }

  authenticate (request: any, _options?: { pauseStream?: boolean }) {
    if (request.isAuthenticated()) {
      return this.pass();
    }
    if (request.body) {
      const user = Object.values(this.database).find(
        (user) => user.login === request.body.login && user.password === request.body.password
      );
      if (user) {
        return this.success(user);
      }
    }

    this.fail();
  }
}

/** Class representing a browser in tests */
export class TestBrowserSession {
  cookies: Record<string, string>;

  constructor (readonly server: FastifyInstance) {
    this.cookies = {};
  }

  async inject (opts: InjectOptions): Promise<LightMyRequestResponse> {
    opts.headers || (opts.headers = {});
    opts.headers.cookie = Object.entries(this.cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');

    const result = await this.server.inject(opts);
    if (result.statusCode < 500) {
      for (const { name, value } of parseCookies(result as unknown as IncomingMessage, { decodeValues: false })) {
        this.cookies[name] = value;
      }
    }
    return result;
  }
}

type SessionOptions = FastifyRegisterOptions<FastifySessionOptions | SecureSessionPluginOptions> | null;

const loadSessionPlugins = (server: FastifyInstance, sessionOptions: SessionOptions = null) => {
  if (process.env.SESSION_PLUGIN === '@fastify/session') {
    server.register(fastifyCookie);
    const options = <FastifyRegisterOptions<FastifySessionOptions>>(sessionOptions || {
      secret: 'a secret with minimum length of 32 characters',
      cookie: { secure: false }
    });
    server.register(fastifySession, options);
  } else {
    server.register(
      fastifySecureSession,
      <FastifyRegisterOptions<SecureSessionPluginOptions> | undefined>(sessionOptions || { key: SecretKey })
    );
  }
};

/** Create a fastify instance with a few simple setup bits added, but without fastify-passport registered or any strategies set up. */
export const getTestServer = (sessionOptions: SessionOptions = null) => {
  const server = fastify();
  loadSessionPlugins(server, sessionOptions);

  server.setErrorHandler((error, _request, reply) => {
    reply.status(500);
    reply.send(error);
  });
  return server;
};

/** Create a fastify instance with fastify-passport plugin registered but with no strategies registered yet. */
export const getRegisteredTestServer = (
  sessionOptions: SessionOptions = null,
  passportOptions: AuthenticatorOptions = {}
) => {
  const fastifyPassport = new Authenticator(passportOptions);
  fastifyPassport.registerUserSerializer(async (user) => JSON.stringify(user));
  fastifyPassport.registerUserDeserializer(async (serialized: string) => JSON.parse(serialized));

  const server = getTestServer(sessionOptions);
  server.register(fastifyPassport.initialize());
  server.register(fastifyPassport.secureSession());

  return { fastifyPassport, server };
};

/** Create a fastify instance with fastify-passport plugin registered and the given strategy registered with it. */
export const getConfiguredTestServer = (
  name = 'test',
  strategy = new TestStrategy('test'),
  sessionOptions: SessionOptions = null,
  passportOptions: AuthenticatorOptions = {}
) => {
  const { fastifyPassport, server } = getRegisteredTestServer(sessionOptions, passportOptions);
  fastifyPassport.use(name, strategy);
  return { fastifyPassport, server };
};
