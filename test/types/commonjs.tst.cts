import { expect } from 'tstyche'
import fastifyPassport = require('../../dist/index.js')

expect(fastifyPassport).type.toHaveProperty('initialize')
expect(fastifyPassport.initialize).type.toBeCallableWith()
expect(fastifyPassport.authenticate).type.toBeCallableWith('test')
expect(fastifyPassport.default).type.toHaveProperty('initialize')
expect(fastifyPassport.Authenticator).type.toBeConstructableWith()
expect(fastifyPassport.Strategy).type.toBeConstructableWith('test')

fastifyPassport.registerUserSerializer(async user => user)
fastifyPassport.registerUserDeserializer(async user => user)

class TestStrategy extends fastifyPassport.Strategy {
  authenticate (): void {}
}

new TestStrategy('test')
