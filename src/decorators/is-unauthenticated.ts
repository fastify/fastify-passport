import type { FastifyPassportRequest } from '../types'

export function isUnauthenticated (this: FastifyPassportRequest): boolean {
  return !this.isAuthenticated()
}
