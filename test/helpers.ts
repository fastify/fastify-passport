import fs from 'fs'
import fastify, { FastifyInstance } from 'fastify'
import fastifySecureSession from 'fastify-secure-session'
import Authenticator from '../src/Authenticator'
import { Strategy } from '../src/strategies'
import { InjectOptions, Response as LightMyRequestResponse } from 'light-my-request'
import parseCookies from 'set-cookie-parser'

const SecretKey = fs.readFileSync(__dirname + '/secure.key')

let counter = 0
export const generateTestUser = () => ({ name: 'test', id: String(counter++) })

export class TestStrategy extends Strategy {
  authenticate(request: any, _options?: { pauseStream?: boolean }) {
    if (request.isAuthenticated()) {
      return this.pass()
    }
    if (request.body && request.body.login === 'test' && request.body.password === 'test') {
      return this.success(generateTestUser())
    }

    this.fail()
  }
}

/** Class representing a browser in tests */
export class TestBrowserSession {
  cookies: Record<string, string>

  constructor(readonly server: FastifyInstance) {
    this.cookies = {}
  }

  async inject(opts: InjectOptions): Promise<LightMyRequestResponse> {
    opts.headers || (opts.headers = {})
    opts.headers.cookie = Object.entries(this.cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')

    const result = await this.server.inject(opts)
    if (result.statusCode < 500) {
      for (const { name, value } of parseCookies(result as any, { decodeValues: false })) {
        this.cookies[name] = value
      }
    }
    return result
  }
}

export const getTestServer = () => {
  const server = fastify()
  void server.register(fastifySecureSession, { key: SecretKey })
  server.setErrorHandler((error, request, reply) => {
    console.error(error)
    void reply.status(500)
    void reply.send(error)
  })
  return server
}

export const getConfiguredTestServer = (name = 'test', strategy = new TestStrategy('test')) => {
  const fastifyPassport = new Authenticator()
  fastifyPassport.use(name, strategy)
  fastifyPassport.registerUserSerializer(async (user) => JSON.stringify(user))
  fastifyPassport.registerUserDeserializer(async (serialized: string) => JSON.parse(serialized))

  const server = getTestServer()
  void server.register(fastifyPassport.initialize())
  void server.register(fastifyPassport.secureSession())

  return { fastifyPassport, server }
}
