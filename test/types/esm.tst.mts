import { expect } from 'tstyche'
import fastifyPassport, { Authenticator, Strategy } from '../../dist/index.js'

expect(fastifyPassport).type.toHaveProperty('initialize')
expect(fastifyPassport.initialize).type.toBeCallableWith()
expect(fastifyPassport.authenticate).type.toBeCallableWith('test')
expect(Authenticator).type.toBeConstructableWith()
expect(Strategy).type.toBeConstructableWith('test')

fastifyPassport.registerUserSerializer(async user => user)
fastifyPassport.registerUserDeserializer(async user => user)

class TestStrategy extends Strategy {
  authenticate (): void {}
}

new TestStrategy('test')
