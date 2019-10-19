import http, { ServerResponse } from 'http'
import AuthenticationError from '../errors'
import Authenticator from '../authenticator'
import BasicStrategy from '../strategies'
import { FastifyReply, FastifyRequest } from 'fastify'
import '../types/fastify'

type FlashObject = { type?: string; message?: string }
type FailureObject = {
  challenge?: string | unknown
  status?: number
  type?: string
}

export interface AuthenticateFactoryOptions {
  scope?: string
  failureFlash?: boolean | string | FlashObject
  failureMessage?: boolean | string
  successRedirect?: string
  failureRedirect?: string
  failWithError?: boolean
  successFlash?: boolean | string | FlashObject
  successMessage?: boolean | string
  assignProperty?: string
  successReturnToOrRedirect?: string
  authInfo?: boolean
  session?: boolean
}

type AuthenticateFactoryCallback = (
  err: null | Error,
  user?: any,
  info?: any,
  statuses?: any | any[],
) => void

export default function authenticateFactory(
  passport: Authenticator,
  name: string | string[],
  options?: AuthenticateFactoryOptions | AuthenticateFactoryCallback,
  callback?: AuthenticateFactoryCallback,
) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  options = options || {}

  let multi = true

  // Cast `name` to an array, allowing authentication to pass through a chain of
  // strategies.  The first strategy to succeed, redirect, or error will halt
  // the chain.  Authentication failures will proceed through each strategy in
  // series, ultimately failing if all strategies fail.
  //
  // This is typically used on API endpoints to allow clients to authenticate
  // using their preferred choice of Basic, Digest, token-based schemes, etc.
  // It is not feasible to construct a chain of multiple strategies that involve
  // redirection (for example both Facebook and Twitter), since the first one to
  // redirect will halt the chain.
  if (!Array.isArray(name)) {
    name = [name]
    multi = false
  }

  function authenticate(request: FastifyRequest, reply: FastifyReply<ServerResponse>, next: any) {
    // accumulator for failures from each strategy in the chain
    const failures: FailureObject[] = []

    function allFailed() {
      if (callback) {
        if (!multi) {
          return callback(null, false, failures[0].challenge, failures[0].status)
        } else {
          const challenges = failures.map(function(f) {
            return f.challenge
          })
          const statuses = failures.map(function(f) {
            return f.status
          })
          return callback(null, false, challenges, statuses)
        }
      }

      // Strategies are ordered by priority.  For the purpose of flashing a
      // message, the first failure will be displayed.
      let failure = failures[0] || {}
      let challenge = failure.challenge || {}
      let msg
      const authenticateOptions = options as AuthenticateFactoryOptions

      if (authenticateOptions.failureFlash) {
        let flash = authenticateOptions.failureFlash
        if (typeof flash === 'boolean') {
          flash = challenge as FlashObject
        }
        if (typeof flash === 'string') {
          flash = { type: 'error', message: flash }
        }
        ;(flash as FlashObject).type = (flash as FlashObject).type || 'error'

        const type = (flash as FlashObject).type || (challenge as FlashObject).type || 'error'
        msg = (flash as FlashObject).message || (challenge as FlashObject).message || challenge
        if (typeof msg === 'string') {
          request.flash(type, msg)
        }
      }
      if (authenticateOptions.failureMessage) {
        msg = authenticateOptions.failureMessage
        if (typeof msg === 'boolean') {
          msg = (challenge as FlashObject).message || challenge
        }
        if (typeof msg === 'string') {
          ;(request.session as any).messages = (request.session as any).messages || []
          ;(request.session as any).messages.push(msg)
        }
      }
      if (authenticateOptions.failureRedirect) {
        return reply.redirect(authenticateOptions.failureRedirect)
      }

      // When failure handling is not delegated to the application, the default
      // is to respond with 401 Unauthorized.  Note that the WWW-Authenticate
      // header will be set according to the strategies in use (see
      // actions#fail).  If multiple strategies failed, each of their challenges
      // will be included in the response.
      const rchallenge: string[] = []
      let rstatus
      let status

      for (let j = 0, len = failures.length; j < len; j++) {
        failure = failures[j]
        challenge = failure.challenge
        status = failure.status

        rstatus = rstatus || status
        if (typeof challenge === 'string') {
          rchallenge.push(challenge)
        }
      }

      reply.code(rstatus || 401)
      if (reply.res.statusCode === 401 && rchallenge.length) {
        reply.header('WWW-Authenticate', rchallenge)
      }
      if (authenticateOptions.failWithError) {
        return next(
          new AuthenticationError(http.STATUS_CODES[reply.res.statusCode]!, rstatus as number),
        )
      }
      reply.send(http.STATUS_CODES[reply.res.statusCode])
    }

    ;(function attempt(i) {
      const layer = name[i]
      // If no more strategies exist in the chain, authentication has failed.
      if (!layer) {
        return allFailed()
      }

      // Get the strategy, which will be used as prototype from which to create
      // a new instance.  Action functions will then be bound to the strategy
      // within the context of the HTTP request/response pair.
      const prototype = passport._strategy(layer)
      if (!prototype) {
        return next(new Error('Unknown authentication strategy "' + layer + '"'))
      }

      const strategy = Object.create(prototype) as BasicStrategy

      // ----- BEGIN STRATEGY AUGMENTATION -----
      // Augment the new strategy instance with action functions.  These action
      // functions are bound via closure the the request/response pair.  The end
      // goal of the strategy is to invoke *one* of these action methods, in
      // order to indicate successful or failed authentication, redirect to a
      // third-party identity provider, etc.

      /**
       * Authenticate `user`, with optional `info`.
       *
       * Strategies should call this function to successfully authenticate a
       * user.  `user` should be an object supplied by the application after it
       * has been given an opportunity to verify credentials.  `info` is an
       * optional argument containing additional user information.  This is
       * useful for third-party authentication strategies to pass profile
       * details.
       */
      strategy.success = function(user: object, info: { type: string; message: string }) {
        if (callback) {
          return callback(null, user, info)
        }

        info = info || {}
        let msg

        const authenticateOptions = options as AuthenticateFactoryOptions

        if (authenticateOptions.successFlash) {
          let flash = authenticateOptions.successFlash
          if (typeof flash === 'boolean') {
            flash = info || {}
          }
          if (typeof flash === 'string') {
            flash = { type: 'success', message: flash }
          }
          flash.type = flash.type || 'success'

          const type = flash.type || info.type || 'success'
          msg = flash.message || info.message || info
          if (typeof msg === 'string') {
            request.flash(type, msg)
          }
        }
        if (authenticateOptions.successMessage) {
          msg = authenticateOptions.successMessage
          if (typeof msg === 'boolean') {
            msg = info.message || info
          }
          if (typeof msg === 'string') {
            ;(request.session as any).messages = (request.session as any).messages || []
            ;(request.session as any).messages.push(msg)
          }
        }
        if (authenticateOptions.assignProperty) {
          request[authenticateOptions.assignProperty] = user
          return next()
        }

        request.logIn(user, authenticateOptions, function(err) {
          if (err) {
            return next(err)
          }

          function complete() {
            if (authenticateOptions.successReturnToOrRedirect) {
              let url = authenticateOptions.successReturnToOrRedirect
              if (request.session && (request.session as any).returnTo) {
                url = (request.session as any).returnTo
                delete (request.session as any).returnTo
              }
              return reply.redirect(url)
            }
            if (authenticateOptions.successRedirect) {
              return reply.redirect(authenticateOptions.successRedirect)
            }
            next()
          }

          if (authenticateOptions.authInfo !== false) {
            passport.transformAuthInfo(info, request, function(error, tinfo) {
              if (error) {
                return next(error)
              }
              request.authInfo = tinfo
              complete()
            })
          } else {
            complete()
          }
        })
      }

      /**
       * Fail authentication, with optional `challenge` and `status`, defaulting
       * to 401.
       *
       * Strategies should call this function to fail an authentication attempt.
       */
      strategy.fail = function(challenge?: string | number | undefined, status?: number) {
        if (typeof challenge === 'number') {
          status = challenge
          challenge = undefined
        }

        // push this failure into the accumulator and attempt authentication
        // using the next strategy
        failures.push({ challenge, status: status! })
        attempt(i + 1)
      }

      /**
       * Redirect to `url` with optional `status`, defaulting to 302.
       *
       * Strategies should call this function to redirect the user (via their
       * user agent) to a third-party website for authentication.
       */
      strategy.redirect = function(url: string, status: number): void {
        reply.status(status || 302)
        reply.redirect(url)
      }

      /**
       * Pass without making a success or fail decision.
       *
       * Under most circumstances, Strategies should not need to call this
       * function.  It exists primarily to allow previous authentication state
       * to be restored, for example from an HTTP session.
       */
      strategy.pass = function() {
        next()
      }

      /**
       * Internal error while performing authentication.
       *
       * Strategies should call this function when an internal error occurs
       * during the process of performing authentication; for example, if the
       * user directory is not available.
       */
      strategy.error = function(err: Error) {
        if (callback) {
          return callback(err)
        }

        next(err)
      }

      // ----- END STRATEGY AUGMENTATION -----

      strategy.authenticate(request, options)
    })(0) // attempt
  }
  return authenticate
}
