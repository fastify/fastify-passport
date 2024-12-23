import fp from 'fastify-plugin';
import { logIn, logOut, isAuthenticated, isUnauthenticated } from './decorators';
import Authenticator from './Authenticator';
import flash = require('@fastify/flash');

export function CreateInitializePlugin (passport: Authenticator) {
  return fp(async (fastify) => {
    fastify.register(flash);
    fastify.decorateRequest('passport', {
      getter () {
        return passport;
      }
    });
    fastify.decorateRequest('logIn', logIn);
    fastify.decorateRequest('login', logIn);
    fastify.decorateRequest('logOut', logOut);
    fastify.decorateRequest('logout', logOut);
    fastify.decorateRequest('isAuthenticated', isAuthenticated);
    fastify.decorateRequest('isUnauthenticated', isUnauthenticated);
    fastify.decorateRequest(passport.userProperty, null);
  });
}
