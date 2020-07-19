import { FastifyRequest } from "fastify";

export type DoneCallback = (err?: Error) => void;
/**
 * Initiate a login session for `user`.
 *
 * Options:
 *   - `session`  Save login state in session, defaults to _true_
 *
 * Examples:
 *
 *     req.logIn(user, { session: false });
 *
 *     req.logIn(user, function(err) {
 *       if (err) { throw err; }
 *       // session saved
 *     });
 *
 * @param {User} user
 * @param {Object} options
 * @param {Function} done
 * @api public
 */
export async function logIn<T = unknown>(this: FastifyRequest, user: T): Promise<void>;
export async function logIn<T = unknown>(this: FastifyRequest, user: T, options: { session?: boolean }): Promise<void>;
export async function logIn<T = unknown>(this: FastifyRequest, user: T, options: { session?: boolean } = {}) {
  let property = "user";
  if (this._passport && this._passport.instance) {
    property = this._passport.instance._userProperty || "user";
  }
  const session = options.session === undefined ? true : options.session;

  this[property] = user;
  if (session) {
    if (!this._passport) {
      throw new Error("passport.initialize() plugin not in use");
    }

    try {
      await this._passport.instance._sessionManager.logIn(this, user);
    } catch (e) {
      this[property] = null;
      throw e;
    }
  }
}
