import fp from 'fastify-plugin'
import { logIn, logOut, isAuthenticated, isUnauthenticated } from './decorators'
import Authenticator from './authenticator'

export default fp(function(fastify, opts, next) {
  const authenticator = new Authenticator()
  fastify.decorateRequest('_passport', { instance: authenticator })
  // TODO: need to add suppoort for req session. We need to check if session is added to fastify
  // if (req.session && req.session[passport._key]) {
  //   // load data from existing session
  //   req._passport.session = req.session[passport._key]
  // }
  fastify.decorateRequest('logIn', logIn)
  fastify.decorateRequest('login', logIn)
  fastify.decorateRequest('logOut', logOut)
  fastify.decorateRequest('logout', logOut)
  fastify.decorateRequest('isAuthenticated', isAuthenticated)
  fastify.decorateRequest('isUnauthenticated', isUnauthenticated)
})
