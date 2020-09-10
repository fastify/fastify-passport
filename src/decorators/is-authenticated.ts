import { FastifyRequest } from 'fastify'

export function isAuthenticated(this: FastifyRequest): boolean {
  let property = 'user'
  if (this.passport && this.passport) {
    property = this.passport.userProperty || 'user'
  }

  return this[property] ? true : false
}
