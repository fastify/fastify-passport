import fastify from 'fastify'
import fastifyCookie from 'fastify-cookie'
import fastifySession from '@fastify/session'
import Authenticator from '../../src/Authenticator'
import { Strategy } from '../../src/strategies'

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

/** Create a fastify instance with a few simple setup bits added, but without fastify-passport registered or any strategies set up. */
export const getTestServer = () => {
  const server = fastify()
  void server.register(fastifyCookie)
  void server.register(fastifySession, {
    secret: 'a secret with minimum length of 32 characters',
    cookie: { secure: false },
  })
  server.setErrorHandler((error, request, reply) => {
    console.error(error)
    void reply.status(500)
    void reply.send(error)
  })
  return server
}

/** Create a fastify instance with fastify-passport plugin registered but with no strategies registered yet. */
export const getRegisteredTestServer = () => {
  const fastifyPassport = new Authenticator({ sessionPlugin: '@fastify/session' })
  fastifyPassport.registerUserSerializer(async (user) => JSON.stringify(user))
  fastifyPassport.registerUserDeserializer(async (serialized: string) => JSON.parse(serialized))

  const server = getTestServer()
  void server.register(fastifyPassport.initialize())
  void server.register(fastifyPassport.secureSession())

  return { fastifyPassport, server }
}

/** Create a fastify instance with fastify-passport plugin registered and the given strategy registered with it. */
export const getConfiguredTestServer = (name = 'test', strategy = new TestStrategy('test')) => {
  const { fastifyPassport, server } = getRegisteredTestServer()
  fastifyPassport.use(name, strategy)
  return { fastifyPassport, server }
}
