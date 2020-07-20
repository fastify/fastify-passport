/// <reference types="fastify-secure-session" />
import http from "http";
import AuthenticationError from "./errors";
import Authenticator from "./Authenticator";
import { Strategy } from "./strategies";
import { FastifyReply, FastifyRequest } from "fastify";

type FlashObject = { type?: string; message?: string };
type FailureObject = {
  challenge?: string | FlashObject;
  status?: number;
  type?: string;
};

const addMessage = (request: FastifyRequest, message: string) => {
  const existing = request.session.get("messages");
  const messages = existing ? [...existing, message] : [message];
  request.session.set("messages", messages);
};

export interface AuthenticateOptions {
  scope?: string | string[];
  failureFlash?: boolean | string | FlashObject;
  failureMessage?: boolean | string;
  successRedirect?: string;
  failureRedirect?: string;
  failWithError?: boolean;
  successFlash?: boolean | string | FlashObject;
  successMessage?: boolean | string;
  assignProperty?: string;
  successReturnToOrRedirect?: string;
  authInfo?: boolean;
  session?: boolean;
}

export type SingleStrategyCallback = (
  request: FastifyRequest,
  reply: FastifyReply,
  err: null | Error,
  user?: any,
  info?: any,
  status?: number
) => Promise<void>;
export type MultiStrategyCallback = (
  request: FastifyRequest,
  reply: FastifyReply,
  err: null | Error,
  user?: any,
  info?: any,
  statuses?: (number | undefined)[]
) => Promise<void>;

export type AuthenticateCallback<Names extends string | string[]> = Names extends string
  ? SingleStrategyCallback
  : MultiStrategyCallback;

const Unhandled = Symbol.for("passport-unhandled");

export class AuthenticationRoute<StrategyNames extends string | string[]> {
  readonly options: AuthenticateOptions;
  readonly strategies: string[];
  readonly isMultiStrategy: boolean;

  constructor(
    readonly authenticator: Authenticator, // aggregator instance that owns the chain of strategies
    strategyOrStrategies: StrategyNames, // list of strategies this handler tries
    options?: AuthenticateOptions, // options governing behaviour of strategies
    readonly callback?: AuthenticateCallback<StrategyNames> // optional custom callback to process the result of the strategy invocations
  ) {
    this.options = options || {};

    // Cast `name` to an array, allowing authentication to pass through a chain of strategies.  The first strategy to succeed, redirect, or error will halt the chain.  Authentication failures will proceed through each strategy in series, ultimately failing if all strategies fail.
    // This is typically used on API endpoints to allow clients to authenticate using their preferred choice of Basic, Digest, token-based schemes, etc. It is not feasible to construct a chain of multiple strategies that involve redirection (for example both Facebook and Twitter), since the first one to redirect will halt the chain.
    if (Array.isArray(strategyOrStrategies)) {
      this.strategies = strategyOrStrategies;
      this.isMultiStrategy = false;
    } else {
      this.strategies = [strategyOrStrategies as string];
      this.isMultiStrategy = false;
    }
  }

  handler = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request._passport) {
      throw new Error("passport.initialize() plugin not in use");
    }
    // accumulator for failures from each strategy in the chain
    const failures: FailureObject[] = [];

    for (const strategy of this.strategies) {
      try {
        return await this.attemptStrategy(failures, strategy, request, reply);
      } catch (e) {
        if (e == Unhandled) {
          continue;
        } else {
          throw e;
        }
      }
    }

    return this.onAllFailed(failures, request, reply);
  };

  async attemptStrategy(failures: FailureObject[], name: string, request: FastifyRequest, reply: FastifyReply) {
    const prototype = this.authenticator.strategy(name);
    if (!prototype) {
      throw new Error(`Unknown authentication strategy ${name}!`);
    }

    const strategy = Object.create(prototype) as Strategy;

    // This is a messed up way of adapting passport's API to fastify's async world. We create a promise that the strategy's per-call functions close over and resolve/reject with the result of the strategy. This augmentation business is a key part of how Passport strategies expect to work.
    return new Promise((resolve, reject) => {
      /**
       * Authenticate `user`, with optional `info`.
       *
       * Strategies should call this function to successfully authenticate a user.  `user` should be an object supplied by the application after it has been given an opportunity to verify credentials.  `info` is an optional argument containing additional user information.  This is useful for third-party authentication strategies to pass profile details.
       */
      strategy.success = (user: any, info: { type?: string; message?: string }) => {
        request.log.debug(`passport strategy ${name} success`);
        if (this.callback) {
          return resolve(this.callback(request, reply, null, user, info));
        }

        info = info || {};
        this.applyFlashOrMessage("success", request, info);

        if (this.options.assignProperty) {
          request[this.options.assignProperty] = user;
          return resolve();
        }

        request
          .logIn(user, this.options)
          .catch(reject)
          .then(() => {
            const complete = () => {
              if (this.options.successReturnToOrRedirect) {
                let url = this.options.successReturnToOrRedirect;
                if (request.session && request.session.get("returnTo")) {
                  url = request.session.get("returnTo");
                  request.session.set("returnTo", undefined);
                }

                reply.redirect(url);
              } else if (this.options.successRedirect) {
                reply.redirect(this.options.successRedirect);
              }
              return resolve();
            };

            if (this.options.authInfo !== false) {
              this.authenticator
                .transformAuthInfo(info, request)
                .catch(reject)
                .then((transformedInfo) => {
                  request.authInfo = transformedInfo;
                  complete();
                });
            } else {
              complete();
            }
          });
      };

      /**
       * Fail authentication, with optional `challenge` and `status`, defaulting to 401.
       *
       * Strategies should call this function to fail an authentication attempt.
       */
      strategy.fail = function (challengeOrStatus?: string | number | undefined, status?: number) {
        let challenge;
        if (typeof challengeOrStatus === "number") {
          status = challengeOrStatus;
          challenge = undefined;
        } else {
          challenge = challengeOrStatus;
        }

        // push this failure into the accumulator and attempt authentication using the next strategy
        failures.push({ challenge, status: status! });
        reject(Unhandled);
      };

      /**
       * Redirect to `url` with optional `status`, defaulting to 302.
       *
       * Strategies should call this function to redirect the user (via their user agent) to a third-party website for authentication.
       */
      strategy.redirect = (url: string, status?: number) => {
        reply.status(status || 302);
        reply.redirect(url);
        resolve();
      };

      /**
       * Pass without making a success or fail decision.
       *
       * Under most circumstances, Strategies should not need to call this function.  It exists primarily to allow previous authentication state to be restored, for example from an HTTP session.
       */
      strategy.pass = () => resolve();

      /**
       * Internal error while performing authentication.
       *
       * Strategies should call this function when an internal error occurs during the process of performing authentication; for example, if the user directory is not available.
       */
      strategy.error = (err: Error) => {
        if (this.callback) {
          return resolve(this.callback(request, reply, err));
        }

        reject(err);
      };

      strategy.authenticate(request, this.options);
    });
  }

  async onAllFailed(failures: FailureObject[], request: FastifyRequest, reply: FastifyReply) {
    if (this.callback) {
      if (this.isMultiStrategy) {
        const challenges = failures.map((f) => f.challenge);
        const statuses = failures.map((f) => f.status);
        return await (this.callback as MultiStrategyCallback)(request, reply, null, false, challenges, statuses);
      } else {
        return await (this.callback as SingleStrategyCallback)(
          request,
          reply,
          null,
          false,
          failures[0].challenge,
          failures[0].status
        );
      }
    }

    // Strategies are ordered by priority.  For the purpose of flashing a message, the first failure will be displayed.
    this.applyFlashOrMessage("failure", request, this.toFlashObject(failures[0]?.challenge, "error"));
    if (this.options.failureRedirect) {
      return reply.redirect(this.options.failureRedirect);
    }

    // When failure handling is not delegated to the application, the default is to respond with 401 Unauthorized.  Note that the WWW-Authenticate header will be set according to the strategies in use (see actions#fail).  If multiple strategies failed, each of their challenges will be included in the response.
    const rchallenge: string[] = [];
    let rstatus: number | undefined;

    for (const failure of failures) {
      rstatus = rstatus || failure.status;
      if (typeof failure.challenge === "string") {
        rchallenge.push(failure.challenge);
      }
    }

    rstatus = rstatus || 401;
    reply.code(rstatus);

    if (reply.statusCode === 401 && rchallenge.length) {
      reply.header("WWW-Authenticate", rchallenge);
    }

    if (this.options.failWithError) {
      throw new AuthenticationError(http.STATUS_CODES[reply.statusCode]!, rstatus);
    }

    reply.send(http.STATUS_CODES[reply.statusCode]);
  }

  applyFlashOrMessage(event: "success" | "failure", request: FastifyRequest, result?: FlashObject) {
    const flashOption = this.options[event + "Flash"];
    const level = event == "success" ? "success" : "error";

    if (flashOption) {
      let flash: FlashObject | undefined;
      if (typeof flashOption === "boolean") {
        flash = this.toFlashObject(result, level);
      } else {
        flash = this.toFlashObject(flashOption, level);
      }

      if (flash && flash.type && flash.message) {
        request.flash(flash.type, flash.message);
      }
    }

    const messageOption = this.options[event + "Message"];
    if (messageOption) {
      const message = typeof messageOption === "boolean" ? this.toFlashObject(result, level)?.message : messageOption;
      if (message) {
        addMessage(request, message);
      }
    }
  }

  toFlashObject(input: string | FlashObject | undefined, type: string) {
    if (typeof input == "undefined") {
      return;
    } else if (typeof input == "string") {
      return { type, message: input };
    } else {
      return input;
    }
  }
}
