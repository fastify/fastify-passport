import { expect } from 'tstyche'
import fastifyPassport, { Authenticator, Strategy } from '../../dist/index.js'

expect(fastifyPassport).type.toHaveProperty('initialize')
expect(fastifyPassport.initialize).type.toBeCallableWith()
expect(fastifyPassport.authenticate).type.toBeCallableWith('test')
expect(Authenticator).type.toBeConstructableWith()
expect(Strategy).type.toBeConstructableWith('test')

expect(fastifyPassport.registerUserSerializer).type.toBeCallableWith(async (user: unknown) => user)
expect(fastifyPassport.registerUserDeserializer).type.toBeCallableWith(async (user: unknown) => user)

class TestStrategy extends Strategy {
  authenticate (): void {}
}

expect(TestStrategy).type.toBeConstructableWith('test')
