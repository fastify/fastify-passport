import { FastifyRequest } from "fastify";

/**
 * Terminate an existing login session.
 *
 * @api public
 */
export async function logOut(this: FastifyRequest): Promise<void> {
  let property = "user";
  if (this._passport && this._passport.instance) {
    property = this._passport.instance._userProperty || "user";
  }

  this[property] = null;
  if (this._passport) {
    this._passport.instance._sessionManager.logOut(this);
  }
}
