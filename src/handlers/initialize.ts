import fp from 'fastify-plugin'
import { logIn, logOut, isAuthenticated, isUnauthenticated } from '../decorators'
import Authenticator, { Request } from '../authenticator'
import { FastifyRequest, FastifyReply } from 'fastify'
import { ServerResponse } from 'http'

export default function initializeFactory (
  passport: Authenticator,
  options: {userProperty?: string} = {}
) {
  return fp(function initialize (fastify, opts, next) {
    fastify.decorateRequest('_passport', { instance: passport })
    fastify.addHook('preValidation', preValidation())
    fastify.decorateRequest('logIn', logIn)
    fastify.decorateRequest('login', logIn)
    fastify.decorateRequest('logOut', logOut)
    fastify.decorateRequest('logout', logOut)
    fastify.decorateRequest('isAuthenticated', isAuthenticated)
    fastify.decorateRequest('isUnauthenticated', isUnauthenticated)
    fastify.decorateRequest(options.userProperty || 'user', null)
    next()
  })
}

function preValidation(): (request: FastifyRequest, reply: FastifyReply<ServerResponse>, done: any) => void {
  return function passport(request: Request, reply: FastifyReply<ServerResponse>, done: any) {
    const sessionKey = request._passport.instance._key
    request._passport.session = request.session[sessionKey]
    done()
  } as (
    request: FastifyRequest,
    reply: FastifyReply<ServerResponse>,
    next: any
  ) => {}
}
