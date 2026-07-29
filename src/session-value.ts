/**
 * Sentinel returned by `Authenticator#runStack` when no function in the stack produced a
 * result, either because the stack was empty or because every entry passed by throwing
 * `'pass'`. It exists so that "nothing handled this" can be told apart from "something
 * handled this and legitimately returned a falsy value" such as `0`, `''` or `false`.
 */
export const kNoResult = Symbol('fastify-passport.noResult')

export type NoResult = typeof kNoResult

/**
 * Whether a serialized user is something we can actually store in, and read back out of, a
 * session. Anything other than `undefined` and `null` qualifies, including falsy values like
 * `0`, `''` and `false`, which are all valid user ids.
 *
 * `undefined` and `null` do not qualify because a session that holds them is indistinguishable
 * from a session that holds no user at all, so accepting them would silently log the user out
 * on the next request.
 */
export function isStorableSessionValue (value: unknown): boolean {
  return value !== undefined && value !== null
}
