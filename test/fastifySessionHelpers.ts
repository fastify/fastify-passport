import fastify from 'fastify'
import fastifyCookie from 'fastify-cookie'
import fastifySession from '@fastify/session'
import Authenticator from '../src/Authenticator'
import { Strategy } from '../src/strategies'

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

/** Create a fastify instance with @fastify/session and fastify-cookie, but without fastify-passport registered or any strategies set up. */
export const getFastifyTestServer = () => {
  const server = fastify()
  void server.register(fastifyCookie)
  void server.register(fastifySession, { secret: 'a secret with minimum length of 32 characters' })
  server.setErrorHandler((error, request, reply) => {
    console.error(error)
    void reply.status(500)
    void reply.send(error)
  })
  return server
}

/** Create a fastify instance with fastify-passport, @fastify/session and fastify-cookie plugins registered but with no strategies registered yet. */
export const getRegisteredFastifyTestServer = () => {
  const fastifyPassport = new Authenticator()
  fastifyPassport.registerUserSerializer(async (user) => JSON.stringify(user))
  fastifyPassport.registerUserDeserializer(async (serialized: string) => JSON.parse(serialized))

  const server = getFastifyTestServer()
  void server.register(fastifyPassport.initialize())
  void server.register(fastifyPassport.secureSession())

  return { fastifyPassport, server }
}

/** Create a fastify instance with fastify-passport, @fastify/session and fastify-cookie plugins registered and the given strategy registered with it. */
export const getConfiguredFastifyTestServer = (name = 'test', strategy = new TestStrategy('test')) => {
  const { fastifyPassport, server } = getRegisteredFastifyTestServer()
  fastifyPassport.use(name, strategy)
  return { fastifyPassport, server }
}
