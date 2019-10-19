import { FastifyRequest } from 'fastify'

export function isAuthenticated(this: FastifyRequest): boolean {
  let property = 'user'
  if (this._passport && this._passport.instance) {
    property = this._passport.instance._userProperty || 'user'
  }

  return this[property] ? true : false
}
