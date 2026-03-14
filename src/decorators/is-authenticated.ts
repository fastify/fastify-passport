import type { FastifyPassportRequest } from '../types'

export function isAuthenticated (this: FastifyPassportRequest): boolean {
  const property = this.passport.userProperty
  return !!this[property]
}
