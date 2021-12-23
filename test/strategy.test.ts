/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Strategy } from '../src'
import Authenticator from '../src/Authenticator'
import { TestStrategy } from './helpers'

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
  })
}

suite('@fastify/session')
suite('fastify-secure-session')
