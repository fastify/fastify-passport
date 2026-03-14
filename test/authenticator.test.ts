import assert from 'node:assert'
import { describe, test } from 'node:test'
import Authenticator from '../src/Authenticator'
import { getConfiguredTestServer } from './helpers'

type TransformRequest = Parameters<Authenticator['transformAuthInfo']>[1]

describe('Authenticator edge cases', () => {
  test('should throw error when no serializer succeeds', async () => {
    const fastifyPassport = new Authenticator()

    fastifyPassport.registerUserSerializer(async () => {
      throw 'pass' // eslint-disable-line no-throw-literal
    })
    fastifyPassport.registerUserSerializer(async () => {
      throw 'pass' // eslint-disable-line no-throw-literal
    })

    try {
      await fastifyPassport.serializeUser({ name: 'test' }, {})
      assert.fail('Should have thrown an error')
    } catch (error) {
      assert.ok(error instanceof Error)
      assert.ok(error.message.includes('Failed to serialize user into session'))
      assert.ok(error.message.includes('Tried 2 serializers'))
    }
  })

  test('should use options.assignProperty instead of default user property in authorize', async () => {
    const { server, fastifyPassport } = getConfiguredTestServer()

    server.post(
      '/authorize',
      { preValidation: fastifyPassport.authorize('test', { assignProperty: 'account' }) },
      async (request, reply) => {
        reply.send({ account: request.account })
      }
    )

    const response = await server.inject({
      method: 'POST',
      payload: { login: 'test', password: 'test' },
      url: '/authorize'
    })

    assert.strictEqual(response.statusCode, 200)
    const body = response.json() as { account?: { name?: string } }
    assert.ok(body.account)
    assert.strictEqual(body.account?.name, 'test')
  })

  test('should handle authorize with callback function as second parameter', async () => {
    const { server, fastifyPassport } = getConfiguredTestServer()

    server.post('/authorize', async (request, reply) => {
      const handler = fastifyPassport.authorize(
        'test',
        async (_req, rep, err, user) => {
          if (err instanceof Error) {
            return rep.status(500).send({ error: err.message })
          }
          rep.send({ authorizedUser: user })
        }
      )
      return handler.call(server, request, reply)
    })

    const response = await server.inject({
      method: 'POST',
      payload: { login: 'test', password: 'test' },
      url: '/authorize'
    })

    assert.strictEqual(response.statusCode, 200)
    const body = response.json() as { authorizedUser?: unknown }
    assert.ok(body.authorizedUser)
  })

  test('should use default authInfo transformer when no transformers are registered', async () => {
    const fastifyPassport = new Authenticator()

    const info = { message: 'test info' }
    const request = {} as TransformRequest
    const result = await fastifyPassport.transformAuthInfo(info, request)

    assert.deepStrictEqual(result, info)
  })

  test('should transform authInfo with registered transformer', async () => {
    const fastifyPassport = new Authenticator()

    fastifyPassport.registerAuthInfoTransformer(async (info) => {
      return { ...info, transformed: true }
    })

    const info = { message: 'test info' }
    const request = {} as TransformRequest
    const result = await fastifyPassport.transformAuthInfo(info, request) as { message: string, transformed?: boolean }

    assert.strictEqual(result.message, 'test info')
    assert.strictEqual(result.transformed, true)
  })

  test('should skip infoTransformers that throw "pass"', async () => {
    const fastifyPassport = new Authenticator()

    fastifyPassport.registerAuthInfoTransformer(async () => {
      throw 'pass' // eslint-disable-line no-throw-literal
    })

    fastifyPassport.registerAuthInfoTransformer(async (info) => {
      return { ...info, transformed: true }
    })

    const info = { message: 'test info' }
    const request = {} as TransformRequest
    const result = await fastifyPassport.transformAuthInfo(info, request) as { message: string, transformed?: boolean }

    assert.strictEqual(result.message, 'test info')
    assert.strictEqual(result.transformed, true)
  })

  test('should throw error from transformer if not "pass"', async () => {
    const fastifyPassport = new Authenticator()

    fastifyPassport.registerAuthInfoTransformer(async () => {
      throw new Error('Transformer error')
    })

    const info = { message: 'test info' }
    const request = {} as TransformRequest

    try {
      await fastifyPassport.transformAuthInfo(info, request)
      assert.fail('Should have thrown an error')
    } catch (error) {
      assert.ok(error instanceof Error)
      assert.strictEqual(error.message, 'Transformer error')
    }
  })
})
