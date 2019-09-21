import { Request } from '../authenticator'

export type DoneCallback = (err?: Error) => void
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
export function logIn<T = unknown>(this: Request, user: T, done: DoneCallback): void
export function logIn<T = unknown>(
  this: Request,
  user: T,
  options: { session?: boolean },
  done?: DoneCallback,
): void
export function logIn<T = unknown>(
  this: Request,
  user: T,
  options: { session?: boolean } | DoneCallback,
  done?: DoneCallback,
) {
  if (typeof options === 'function') {
    done = options
    options = { session: false }
  }
  options = options || {}

  let property = 'user'
  if (this._passport && this._passport.instance) {
    property = this._passport.instance._userProperty || 'user'
  }
  const session = options.session === undefined ? true : options.session

  this[property] = user
  if (session) {
    if (!this._passport) {
      throw new Error('passport.initialize() middleware not in use')
    }
    if (typeof done !== 'function') {
      throw new Error('req.login requires a callback function')
    }

    const self = this
    this._passport.instance._sessionManager.logIn(this, user, function(err?: Error) {
      if (err) {
        self[property] = null
        return done!(err)
      }
      done!()
    })
  } else {
    if (done) {
      done()
    }
  }
}
