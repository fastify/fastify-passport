import type { PassportUser } from 'fastify'

/** Result of a programmatic authentication attempt via authenticateRequest(). */
export interface AuthResult {
  /** Whether authentication succeeded. */
  ok: boolean
  /** Name of the strategy that produced this result. Undefined when all strategies in a multi-strategy attempt failed. */
  strategy?: string
  /** The authenticated user object, present only on success. */
  user?: PassportUser
  /** Additional data from the strategy's verify callback (e.g., OAuth tokens, scope, messages). Each strategy defines its own schema for this field. */
  info?: unknown
  /** HTTP status code for the outcome (e.g. 200 on success, 401 on failure, 302 on redirect, 500 on strategy error). */
  statusCode: number
  /** Sanitized error from a strategy that called this.error(). Contains a generic message and the error class name — raw messages are stripped to prevent leaking tokens or credentials. Only present when a strategy signals an infrastructure error. */
  error?: Error
  /** WWW-Authenticate challenge strings from failed strategies. Each string describes an authentication scheme the client can use to retry. Only present when all strategies fail. */
  challenges?: string[]
  /** Redirect URL if a strategy requested a redirect (e.g. OAuth flow). */
  redirectUrl?: string
}

/** Details of a single strategy execution attempt. */
export interface AuthAttempt {
  /** Name of the strategy that was attempted. */
  strategy: string
  /** Outcome of this specific attempt. */
  outcome: 'success' | 'fail' | 'pass' | 'error' | 'redirect'
  /** Time elapsed for this individual attempt in milliseconds. */
  elapsedMs: number
  /** Error class name if outcome is 'error' (e.g. 'TokenExpiredError'). */
  errorType?: string
}

/** Request-scoped authentication context for audit logging and metrics. */
export interface AuthContext {
  /** Name of the strategy that successfully authenticated, undefined if all strategies failed. */
  successfulStrategy?: string
  /** Total time elapsed during authentication in milliseconds (across all attempts). */
  elapsedMs: number
  /** Overall outcome of the authentication attempt. */
  outcome: 'authenticated' | 'rejected'
  /** Safe user identifier (string only, never the full user object). */
  userId?: string
  /** Scopes or permissions associated with the authentication. */
  scopes?: string[]
  /** Details of each strategy attempt in order. */
  attempts: AuthAttempt[]
}
