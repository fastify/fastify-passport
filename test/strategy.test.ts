/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Strategy } from '../src'
import Authenticator from '../src/Authenticator'
import { getConfiguredTestServer, TestStrategy } from './helpers'

const suite = (sessionPluginName) => {
  describe(`${sessionPluginName} tests`, () => {
    test('should be able to unuse strategy', () => {
      const fastifyPassport = new Authenticator()
      const testStrategy = new TestStrategy('test')
      fastifyPassport.use(testStrategy)
      fastifyPassport.unuse('test')
    })

    test('should throw error if strategy has no name', () => {
      const fastifyPassport = new Authenticator()
      expect(() => {
        fastifyPassport.use({} as Strategy)
      }).toThrow()
    })

    test('should catch synchronous strategy errors and fail authentication', async () => {
      class ErrorStrategy extends Strategy {
        authenticate(_request: any, _options?: { pauseStream?: boolean }) {
          throw new Error('the strategy threw an error')
        }
      }

      const { server, fastifyPassport } = getConfiguredTestServer('test', new ErrorStrategy('test'))
      server.get('/', { preValidation: fastifyPassport.authenticate('test') }, async () => 'hello world!')

      const response = await server.inject({ method: 'GET', url: '/' })
      expect(response.statusCode).toEqual(500)
      expect(JSON.parse(response.body).message).toEqual('the strategy threw an error')
    })

    test('should catch asynchronous strategy errors and fail authentication', async () => {
      class ErrorStrategy extends Strategy {
        async authenticate(_request: any, _options?: { pauseStream?: boolean }) {
          await Promise.resolve()
          throw new Error('the strategy threw an error')
        }
      }

      const { server, fastifyPassport } = getConfiguredTestServer('test', new ErrorStrategy('test'))
      server.get('/', { preValidation: fastifyPassport.authenticate('test') }, async () => 'hello world!')

      const response = await server.inject({ method: 'GET', url: '/' })
      expect(response.statusCode).toEqual(500)
      expect(JSON.parse(response.body).message).toEqual('the strategy threw an error')
    })

    test('should be able to fail with a failure flash message', async () => {
      class ErrorStrategy extends Strategy {
        async authenticate(_request: any, _options?: { pauseStream?: boolean }) {
          await Promise.resolve()
          this.fail({ message: 'The strategy failed with an error message' }, 401)
        }
      }

      const { server, fastifyPassport } = getConfiguredTestServer('test', new ErrorStrategy('test'))
      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { failureFlash: true }) },
        async () => 'hello world!'
      )

      const response = await server.inject({ method: 'GET', url: '/' })
      expect(response.statusCode).toEqual(401)
    })

    test('should be able to fail without a failure flash message', async () => {
      class ErrorStrategy extends Strategy {
        async authenticate(_request: any, _options?: { pauseStream?: boolean }) {
          await Promise.resolve()
          this.fail(401)
        }
      }

      const { server, fastifyPassport } = getConfiguredTestServer('test', new ErrorStrategy('test'))
      server.get('/', { preValidation: fastifyPassport.authenticate('test') }, async () => 'hello world!')

      const response = await server.inject({ method: 'GET', url: '/' })
      expect(response.statusCode).toEqual(401)
    })
  })
}

suite('@fastify/session')
suite('@fastify/secure-session')
