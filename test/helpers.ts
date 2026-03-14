import fs from 'node:fs'
import { join } from 'node:path'
import fastify, { InjectOptions, LightMyRequestResponse, type FastifyPluginCallback } from 'fastify'
import Authenticator, { AuthenticatorOptions } from '../src/Authenticator'
import { Strategy, type AnyStrategy } from '../src/strategies'
import parseCookies from 'set-cookie-parser'

export type TestServer = Awaited<ReturnType<typeof fastify>>

type SessionPlugin = FastifyPluginCallback<Record<string, unknown>>

const fastifyCookie = require('@fastify/cookie') as SessionPlugin
const fastifySecureSession = require('@fastify/secure-session') as SessionPlugin
const fastifySessionModule = require('@fastify/session') as { fastifySession?: SessionPlugin, default?: SessionPlugin }
const fastifySession = fastifySessionModule.fastifySession ?? fastifySessionModule.default

if (!fastifySession) {
  throw new Error('Could not load @fastify/session plugin in tests')
}

type StrategyRequest = Parameters<Strategy['authenticate']>[0]
type StrategyOptions = Parameters<Strategy['authenticate']>[1]
type LoginBody = { login?: string, password?: string }

export interface PassportSession {
  get<T = unknown> (key: string): T
  set (key: string, value: unknown): void
  regenerate?: (callback: (error?: Error) => void) => void
}

export type PassportRequestDecorators = {
  session: PassportSession
  user?: unknown
  account?: unknown
  authInfo?: unknown
  flash: (type: string, ...message: string[] | [string[]]) => number
  logIn: (user: unknown, options?: { session?: boolean }) => Promise<void>
  login: (user: unknown, options?: { session?: boolean }) => Promise<void>
  logOut: () => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: () => boolean
  isUnauthenticated: () => boolean
}

export type PassportReplyDecorators = {
  flash: (type?: string) => unknown
  generateCsrf: () => string
}

export const asPassportRequest = (request: object): StrategyRequest & PassportRequestDecorators => {
  return request as StrategyRequest & PassportRequestDecorators
}

export const asPassportReply = <TReply extends object>(reply: TReply): TReply & PassportReplyDecorators => {
  return reply as TReply & PassportReplyDecorators
}

const getLoginBody = (request: StrategyRequest): LoginBody | undefined => {
  if (typeof request.body === 'object' && request.body !== null) {
    return request.body as LoginBody
  }
  return undefined
}

const SecretKey = fs.readFileSync(join(__dirname, '../../test', 'secure.key'))

let counter = 0
export const generateTestUser = () => ({ name: 'test', id: String(counter++) })

export class TestStrategy extends Strategy {
  authenticate (request: StrategyRequest, _options?: StrategyOptions) {
    const decoratedRequest = asPassportRequest(request)

    if (decoratedRequest.isAuthenticated()) {
      return this.pass()
    }

    const body = getLoginBody(request)
    if (body && body.login === 'test' && body.password === 'test') {
      return this.success(generateTestUser())
    }

    this.fail()
  }
}

export class TestDatabaseStrategy extends Strategy {
  readonly database: Record<string, { id: string; login: string; password: string }>

  constructor (
    name: string,
    database: Record<string, { id: string; login: string; password: string }> = {}
  ) {
    super(name)
    this.database = database
  }

  authenticate (request: StrategyRequest, _options?: StrategyOptions) {
    const decoratedRequest = asPassportRequest(request)

    if (decoratedRequest.isAuthenticated()) {
      return this.pass()
    }

    const body = getLoginBody(request)
    if (body) {
      const user = Object.values(this.database).find(
        (user) => user.login === body.login && user.password === body.password
      )
      if (user) {
        return this.success(user)
      }
    }

    this.fail()
  }
}

/** Class representing a browser in tests */
export class TestBrowserSession {
  cookies: Record<string, string>
  server: TestServer

  constructor (server: TestServer) {
    this.server = server
    this.cookies = {}
  }

  async inject (opts: InjectOptions): Promise<LightMyRequestResponse> {
    opts.headers || (opts.headers = {})
    opts.headers.cookie = Object.entries(this.cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')

    const result = await this.server.inject(opts)
    if (result.statusCode < 500) {
      const setCookie = result.headers['set-cookie']
      const cookieInput = Array.isArray(setCookie) ? setCookie : (setCookie ? [setCookie] : [])
      for (const { name, value } of parseCookies(cookieInput, { decodeValues: false })) {
        this.cookies[name] = value
      }
    }
    return result
  }
}

type SessionOptions = Record<string, unknown> | null

const loadSessionPlugins = (server: TestServer, sessionOptions: SessionOptions = null) => {
  if (process.env.SESSION_PLUGIN === '@fastify/session') {
    server.register(fastifyCookie)
    const options = sessionOptions || {
      secret: 'a secret with minimum length of 32 characters',
      cookie: { secure: false }
    }
    server.register(fastifySession, options)
  } else {
    server.register(fastifySecureSession, sessionOptions || { key: SecretKey })
  }
}

/** Create a fastify instance with a few simple setup bits added, but without fastify-passport registered or strategies set up. */
export const getTestServer = (sessionOptions: SessionOptions = null) => {
  const server = fastify()
  loadSessionPlugins(server, sessionOptions)

  server.setErrorHandler((error, _request, reply) => {
    reply.status(500)
    reply.send(error)
  })
  return server
}

/** Create a fastify instance with fastify-passport plugin registered but with no strategies registered yet. */
export const getRegisteredTestServer = (
  sessionOptions: SessionOptions = null,
  passportOptions: AuthenticatorOptions = {}
) => {
  const fastifyPassport = new Authenticator(passportOptions)
  fastifyPassport.registerUserSerializer(async (user) => JSON.stringify(user))
  fastifyPassport.registerUserDeserializer(async (serialized: string) => JSON.parse(serialized))

  const server = getTestServer(sessionOptions)
  server.register(fastifyPassport.initialize())
  server.register(fastifyPassport.secureSession())

  return { fastifyPassport, server }
}

/** Create a fastify instance with fastify-passport plugin registered and the given strategy registered with it. */
export const getConfiguredTestServer = (
  name = 'test',
  strategy: AnyStrategy = new TestStrategy('test'),
  sessionOptions: SessionOptions = null,
  passportOptions: AuthenticatorOptions = {}
) => {
  const { fastifyPassport, server } = getRegisteredTestServer(sessionOptions, passportOptions)
  fastifyPassport.use(name, strategy)
  return { fastifyPassport, server }
}
