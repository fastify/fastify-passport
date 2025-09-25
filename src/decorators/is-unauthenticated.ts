import type { FastifyRequest } from 'fastify'

export function isUnauthenticated (this: FastifyRequest): boolean {
  return !this.isAuthenticated()
}
