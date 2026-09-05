import type { FastifyRequest } from 'fastify'

/**
 * Structural shape shared by the session objects of `@fastify/session` and
 * `@fastify/secure-session`, the two session plugins fastify-passport can be used
 * with. This is declared locally, instead of importing the types from those
 * packages, because both are optional: an application only installs the one it
 * actually uses. Importing either package's types directly meant that anyone
 * missing the *other* one got a `Cannot find module` compile error, even though
 * their code never touched it.
 */
export type PassportSession = {
  get(key: string): unknown
  set(key: string, value: unknown): void
  data(): unknown
  regenerate?(ignoreFields?: string[]): void | Promise<void>
}

/**
 * Reads `request.session` typed as `PassportSession`.
 *
 * `FastifyRequest` doesn't declare a `session` property itself — it's added at
 * runtime by whichever session plugin the application registers. This is the
 * single place that assumes it's there and has the expected shape, so callers
 * elsewhere in the codebase never need to cast `request` themselves.
 */
export function getSession (request: FastifyRequest): PassportSession {
  return (request as FastifyRequest & { session: PassportSession }).session
}
