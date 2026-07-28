import { expect } from 'tstyche'
import fastifyPassport = require('../../dist/index.js')

expect(fastifyPassport).type.toHaveProperty('initialize')
expect(fastifyPassport.initialize).type.toBeCallableWith()
expect(fastifyPassport.authenticate).type.toBeCallableWith('test')
expect(fastifyPassport.default).type.toHaveProperty('initialize')
expect(fastifyPassport.Authenticator).type.toBeConstructableWith()
expect(fastifyPassport.Strategy).type.toBeConstructableWith('test')

expect(fastifyPassport.registerUserSerializer).type.toBeCallableWith(async (user: unknown) => user)
expect(fastifyPassport.registerUserDeserializer).type.toBeCallableWith(async (user: unknown) => user)

class TestStrategy extends fastifyPassport.Strategy {
  authenticate (): void {}
}

expect(TestStrategy).type.toBeConstructableWith('test')
