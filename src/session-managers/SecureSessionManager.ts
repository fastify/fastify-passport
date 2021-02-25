import { FastifyRequest } from 'fastify'
import { SerializeFunction } from '../Authenticator'
import { SessionManager } from './SessionManager'

/** Class for storing passport data in the session using `fastify-secure-session` */
export class SecureSessionManager implements SessionManager {
  private readonly key: string
  private readonly serializeUser: SerializeFunction

  constructor(options: { key: string }, serializeUser: SerializeFunction) {
    const { key = 'passport' } = options
    this.key = key
    this.serializeUser = serializeUser
  }

  public async logIn(request: FastifyRequest, user: any) {
    const object = await this.serializeUser(user, request)
    request.session.set(this.key, object)
  }

  public async logOut(request: FastifyRequest) {
    request.session.set(this.key, undefined)
  }

  public getUserFromSession(request: FastifyRequest) {
    return request.session.get(this.key)
  }
}
