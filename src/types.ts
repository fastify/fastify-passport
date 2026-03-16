import type { flashFactory } from '@fastify/flash/lib/flash'
import type {
  AnyFastifyInstance,
  ApplyDecorators,
  FastifyPluginAsync,
  FastifyPluginOptions
} from 'fastify'
import type { FastifyRequest } from 'fastify/types/request'
import type { FastifyReply } from 'fastify/types/reply'
import type Authenticator from './Authenticator'

/**
 * Extend this via declaration merging in user-land:
 *
 * declare module '@fastify/passport' {
 *   interface PassportUser {
 *     id: string
 *   }
 * }
 */
export interface PassportUser {}

export interface ExpressSessionData {
  [key: string]: unknown
}

export interface SessionLike {
  get (key: string): unknown
  set (key: string, value: unknown): void
  regenerate?: (keepSessionInfoKeys?: string[]) => Promise<void>
  data?: () => Record<string, unknown> | undefined
}

export interface FastifyPassportRequestDecorators {
  flash: ReturnType<typeof flashFactory>['request']
  login: (user: unknown, options?: { session?: boolean; keepSessionInfo?: boolean }) => Promise<void>
  logIn: (user: unknown, options?: { session?: boolean; keepSessionInfo?: boolean }) => Promise<void>
  logout: () => Promise<void>
  logOut: () => Promise<void>
  isAuthenticated: () => boolean
  isUnauthenticated: () => boolean
  passport: Authenticator
  user?: PassportUser
  authInfo?: Record<string, unknown>
  account?: PassportUser
  session: SessionLike
  [key: string]: unknown
}

export interface FastifyPassportReplyDecorators {
  flash: ReturnType<typeof flashFactory>['reply']
}

export type FastifyPassportInitializePluginDecorators = {
  request: FastifyPassportRequestDecorators
  reply: FastifyPassportReplyDecorators
}

export type FastifyPassportInitializePlugin<TInstance extends AnyFastifyInstance = AnyFastifyInstance> = FastifyPluginAsync<
  FastifyPluginOptions,
  TInstance,
  ApplyDecorators<TInstance, FastifyPassportInitializePluginDecorators>
>

export type FastifyPassportRequest = FastifyRequest & FastifyPassportRequestDecorators
export type FastifyPassportReply = FastifyReply & FastifyPassportReplyDecorators
