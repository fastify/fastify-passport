import { FastifyRequest } from 'fastify';

/**
 * Terminate an existing login session.
 *
 * @api public
 */
export async function logOut (this: FastifyRequest): Promise<void> {
  const property = this.passport.userProperty;
  this[property] = null;
  await this.passport.sessionManager.logOut(this);
}
