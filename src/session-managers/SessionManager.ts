import { FastifyRequest } from 'fastify/types/request'

/** Abstract class for storing passport data in the session */
export abstract class SessionManager {
  abstract logIn(request: FastifyRequest, user: any): Promise<void>
  abstract logOut(request: FastifyRequest): Promise<void>
  abstract getUserFromSession(request: FastifyRequest): string | number
}
