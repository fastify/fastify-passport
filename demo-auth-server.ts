import fastify, { FastifyRequest } from 'fastify'
import fastifyPassport from './src/index'
import { Strategy } from './src/strategies'
import fastifySecureSession from '@fastify/secure-session'

const server = fastify({ logger: true })

// 1. Setup Session plugins (required by passport core)
server.register(fastifySecureSession, {
    key: Buffer.alloc(32, 'a'),
    cookie: { path: '/' }
})
server.register(fastifyPassport.initialize())
// (Commented out because this adds a global block that intercepts requests before they reach our programmatic handler)
// server.register(fastifyPassport.secureSession())

// 2. Define our Mock Strategies

// A mock API Key strategy that only accepts "secret-key"
class ApiKeyStrategy extends Strategy {
    name = 'api-key'
    authenticate(request: FastifyRequest) {
        const key = request.headers['x-api-key']
        if (key === 'secret-key') {
            return this.success({ id: 'user-123', name: 'API User' })
        }
        this.fail('ApiKey', 401)
    }
}

// A mock Session strategy that checks if a session exists
class MockSessionStrategy extends Strategy {
    name = 'session'
    authenticate(request: FastifyRequest) {
        // In a real app, this would verify and deserialize the secure session cookie
        if (request.session && request.session.get('passport')) {
            return this.success({ id: 'session-user', name: 'Session User' })
        }
        // If no session exists, fail so it falls back to the next strategy
        this.fail('Session', 401)
    }
}

// 3. Register the strategies
fastifyPassport.use('api-key', new ApiKeyStrategy('api-key'))
fastifyPassport.use('session', new MockSessionStrategy('session'))

// 4. Create the Demo Routes using the new programmatic API

server.get('/public', (request, reply) => {
    reply.send({ message: 'This is a public route.' })
})

server.get('/login', (request, reply) => {
    // In a real app this would be checking user credentials
    // For the demo we just blindly set the session cookie
    request.session.set('passport', { user: 'u1' })
    reply.send({ message: 'Logged in! A secure session cookie has been set.' })
})

server.get('/logout', (request, reply) => {
    request.session.delete()
    reply.send({ message: 'Logged out! Session cookie cleared.' })
})

server.get('/protected', async (request, reply) => {
    // Using the new programmatic API!
    // Try session first, fall back to API key
    const result = await fastifyPassport.authenticateRequest(
        ['session', 'api-key'],
        request,
        reply
    )

    if (result.ok) {
        // Authenticated! We control the response.
        return reply.code(200).send({
            message: 'Authentication successful!',
            authenticatedBy: result.strategy,
            user: result.user,
            context: request.authContext
        })
    } else {
        // Failed! We control the response formatting.
        return reply.code(result.statusCode!).send({
            error: 'Authentication failed',
            challenges: result.challenges, // Returns ['Session', 'ApiKey']
            context: request.authContext
        })
    }
})

// 5. Start the server
server.listen({ port: 3000 }, (err, address) => {
    if (err) {
        server.log.error(err)
        process.exit(1)
    }
    console.log(`\n🚀 Demo server listening at ${address}`)
    console.log('\n--- Test Endpoints ---')
    console.log('Test programmatic auth fallback on the /protected route.')
    console.log('The route will try the [Session] strategy first, and fall back to [API Key].\n')
    console.log(`  Login (creates session):   curl ${address}/login`)
    console.log(`  Protected (valid key):     curl -H "x-api-key: secret-key" ${address}/protected`)
    console.log(`  Protected (invalid key):   curl -H "x-api-key: invalid" ${address}/protected`)
    console.log(`  Logout (clears session):   curl ${address}/logout\n`)
})
