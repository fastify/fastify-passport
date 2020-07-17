import { FastifyRequest } from "fastify";
import { DeserializeFunction } from "../Authenticator";

export class Strategy {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
  /**
   * Authenticate request.
   *
   * This function must be overridden by subclasses.  In abstract form, it always
   * throws an exception.
   *
   * @param {Object} req The request to authenticate.
   * @param {Object} [options] Strategy-specific options.
   * @api public
   */
  authenticate(request: FastifyRequest, options?: any): void;
  authenticate() {
    throw new Error("Strategy#authenticate must be overridden by subclass");
  }

  success?: AugmentedStrategy["success"];
  fail?: AugmentedStrategy["fail"];
  redirect?: AugmentedStrategy["redirect"];
  pass?: AugmentedStrategy["pass"];
  error?: AugmentedStrategy["error"];
}

export interface AugmentedStrategy {
  name: string;
  _deserializeUser?: DeserializeFunction;

  /**
   * Performs authentication for the request.
   * Note: Virtual function - re-implement in the strategy.
   * @param req The request to authenticate.
   * @param options Options passed to the strategy.
   */
  authenticate(request: FastifyRequest, options?: any): void;

  //
  // Augmented strategy functions.
  // These are available only from the 'authenticate' function.
  // They are added manually by the passport framework.
  //

  /**
   * Authenticate `user`, with optional `info`.
   *
   * Strategies should call this function to successfully authenticate a
   * user.  `user` should be an object supplied by the application after it
   * has been given an opportunity to verify credentials.  `info` is an
   * optional argument containing additional user information.  This is
   * useful for third-party authentication strategies to pass profile
   * details.
   *
   * @param {Object} user
   * @param {Object} info
   * @api public
   */
  success(user: any, info?: any): void;

  /**
   * Fail authentication, with optional `challenge` and `status`, defaulting
   * to 401.
   *
   * Strategies should call this function to fail an authentication attempt.
   *
   * @param {String} challenge (Can also be an object with 'message' and 'type' fields).
   * @param {Number} status
   * @api public
   */
  fail(challenge?: any, status?: number): void;
  fail(status: number): void;

  /**
   * Redirect to `url` with optional `status`, defaulting to 302.
   *
   * Strategies should call this function to redirect the user (via their
   * user agent) to a third-party website for authentication.
   *
   * @param {String} url
   * @param {Number} status
   * @api public
   */
  redirect(url: string, status?: number): void;

  /**
   * Pass without making a success or fail decision.
   *
   * Under most circumstances, Strategies should not need to call this
   * function.  It exists primarily to allow previous authentication state
   * to be restored, for example from an HTTP session.
   *
   * @api public
   */
  pass(): void;

  /**
   * Internal error while performing authentication.
   *
   * Strategies should call this function when an internal error occurs
   * during the process of performing authentication; for example, if the
   * user directory is not available.
   *
   * @param {Error} err
   * @api public
   */
  error(err: Error): void;
}
