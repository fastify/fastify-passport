import { Request } from '../authenticator'

export function isAuthenticated(this: Request): boolean {
  let property = 'user'
  if (this._passport && this._passport.instance) {
    property = this._passport.instance._userProperty || 'user'
  }

  return this[property] ? true : false
}
