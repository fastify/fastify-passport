import { FastifyRequest } from 'fastify';

export function isAuthenticated (this: FastifyRequest): boolean {
  const property = this.passport.userProperty;
  return !!this[property];
}
