import { FastifyPluginAsync, FastifyRequest, RouteHandlerMethod } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { AuthenticateCallback, AuthenticateOptions, AuthenticationRoute } from './AuthenticationRoute'
import { CreateInitializePlugin } from './CreateInitializePlugin'
import { SecureSessionManager } from './session-managers/SecureSessionManager'
import { AnyStrategy, SessionStrategy, Strategy } from './strategies'

export type SerializeFunction<User = any, SerializedUser = any> = (
  user: User,
  req: FastifyRequest
) => Promise<SerializedUser>

export type DeserializeFunction<SerializedUser = any, User = any> = (
  serialized: SerializedUser,
  req: FastifyRequest
) => Promise<User>

export type InfoTransformerFunction = (info: any) => Promise<any>

export interface AuthenticatorOptions {
  key?: string
  userProperty?: string
  clearSessionOnLogin?: boolean
  clearSessionIgnoreFields?: string[]
}

export class Authenticator {
  // a Fastify-instance wide unique string identifying this instance of fastify-passport (default: "passport")
  public key: string
  // the key on the request at which to store the deserialized user value (default: "user")
  public userProperty: string
  public sessionManager: SecureSessionManager

  private strategies: { [k: string]: AnyStrategy } = {}
  private serializers: SerializeFunction<any, any>[] = []
  private deserializers: DeserializeFunction<any, any>[] = []
  private infoTransformers: InfoTransformerFunction[] = []
  private clearSessionOnLogin: boolean
  private clearSessionIgnoreFields: string[]

  constructor(options: AuthenticatorOptions = {}) {
    this.key = options.key || 'passport'
    this.userProperty = options.userProperty || 'user'
    this.use(new SessionStrategy(this.deserializeUser.bind(this)))
    this.clearSessionOnLogin = options.clearSessionOnLogin ?? true
    this.clearSessionIgnoreFields = ['passport', 'session', ...(options.clearSessionIgnoreFields || [])]
    this.sessionManager = new SecureSessionManager(
      {
        key: this.key,
        clearSessionOnLogin: this.clearSessionOnLogin,
        clearSessionIgnoreFields: this.clearSessionIgnoreFields,
      },
      this.serializeUser.bind(this)
    )
  }

  use(strategy: AnyStrategy): this
  use(name: string, strategy: AnyStrategy): this
  use(name: AnyStrategy | string, strategy?: AnyStrategy): this {
    if (!strategy) {
      strategy = name as AnyStrategy
      name = strategy.name as string
    }
    if (!name) {
      throw new Error('Authentication strategies must have a name')
    }

    this.strategies[name as string] = strategy
    return this
  }

  public unuse(name: string): this {
    delete this.strategies[name]
    return this
  }

  public initialize(): FastifyPluginAsync {
    return CreateInitializePlugin(this)
  }

  /**
   * Authenticates requests.
   *
   * Applies the `name`ed strategy (or strategies) to the incoming request, in order to authenticate the request.  If authentication is successful, the user will be logged in and populated at `req.user` and a session will be established by default.  If authentication fails, an unauthorized response will be sent.
   *
   * Options:
   *   - `session`          Save login state in session, defaults to _true_
   *   - `successRedirect`  After successful login, redirect to given URL
   *   - `successMessage`   True to store success message in
   *                        req.session.messages, or a string to use as override
   *                        message for success.
   *   - `successFlash`     True to flash success messages or a string to use as a flash
   *                        message for success (overrides any from the strategy itself).
   *   - `failureRedirect`  After failed login, redirect to given URL
   *   - `failureMessage`   True to store failure message in
   *                        req.session.messages, or a string to use as override
   *                        message for failure.
   *   - `failureFlash`     True to flash failure messages or a string to use as a flash
   *                        message for failures (overrides any from the strategy itself).
   *   - `assignProperty`   Assign the object provided by the verify callback to given property
   *
   * An optional `callback` can be supplied to allow the application to override the default manner in which authentication attempts are handled.  The callback has the following signature, where `user` will be set to the authenticated user on a successful authentication attempt, or `false` otherwise.  An optional `info` argument will be passed, containing additional details provided by the strategy's verify callback - this could be information about a successful authentication or a challenge message for a failed authentication. An optional `status` argument will be passed when authentication fails - this could be a HTTP response code for a remote authentication failure or similar.
   *
   *     fastify.get('/protected', function(req, res, next) {
   *       passport.authenticate('local', function(err, user, info, status) {
   *         if (err) { return next(err) }
   *         if (!user) { return res.redirect('/signin') }
   *         res.redirect('/account');
   *       })(req, res, next);
   *     });
   *
   * Note that if a callback is supplied, it becomes the application's responsibility to log-in the user, establish a session, and otherwise perform the desired operations.
   *
   * Examples:
   *
   *    // protect a route with a validation handler
   *    fastify.get(
   *      '/protected',
   *      { preValidation: fastifyPassport.authenticate('local', {failureRedirect: '/login}) },
   *      async (request, reply) => {
   *       reply.send("Hello " + request.user.name);
   *      }
   *    )
   *
   *    // handle a route with a custom callback that uses request/reply to handle the request depending on the authentication result
   *    fastify.get('/checkLogin', fastifyPassport.authenticate('local', async (request, reply, err, user) => {
   *      if (user) {
   *        return reply.redirect(request.session.get('returnTo'));
   *      } else {
   *        return reply.redirect('/login');
   *      }
        })
   *
   *    fastifyPassport.authenticate('basic', { session: false })(req, res);
   *
   *    fastify.get('/auth/twitter', fastifyPassport.authenticate('twitter'));
   *    fastify.get('/auth/twitter/callback', fastifyPassport.authenticate('twitter', { successRedirect: '/', failureRedirect: '/login' }))
   *
   * @param {|String|Array} name
   * @param {Object} options
   * @param {Function} callback
   * @return {Function}
   * @api public
   */

  public authenticate<StrategyOrStrategies extends string | Strategy | (string | Strategy)[]>(
    strategy: StrategyOrStrategies,
    callback?: AuthenticateCallback<StrategyOrStrategies>
  ): RouteHandlerMethod
  public authenticate<StrategyOrStrategies extends string | Strategy | (string | Strategy)[]>(
    strategy: StrategyOrStrategies,
    options?: AuthenticateOptions
  ): RouteHandlerMethod
  public authenticate<StrategyOrStrategies extends string | Strategy | (string | Strategy)[]>(
    strategy: StrategyOrStrategies,
    options?: AuthenticateOptions,
    callback?: AuthenticateCallback<StrategyOrStrategies>
  ): RouteHandlerMethod
  public authenticate<StrategyOrStrategies extends string | Strategy | (string | Strategy)[]>(
    strategyOrStrategies: StrategyOrStrategies,
    optionsOrCallback?: AuthenticateOptions | AuthenticateCallback<StrategyOrStrategies>,
    callback?: AuthenticateCallback<StrategyOrStrategies>
  ): RouteHandlerMethod {
    let options: AuthenticateOptions | undefined
    if (typeof optionsOrCallback == 'function') {
      options = {}
      callback = optionsOrCallback
    } else {
      options = optionsOrCallback
    }

    return new AuthenticationRoute(this, strategyOrStrategies, options, callback).handler
  }

  /**
   * Hook or handler that will authorize a third-party account using the given `strategy` name, with optional `options`.
   *
   * If authorization is successful, the result provided by the strategy's verify callback will be assigned to `request.account`.  The existing login session and `request.user` will be unaffected.
   *
   * This function is particularly useful when connecting third-party accounts to the local account of a user that is currently authenticated.
   *
   * Examples:
   *
   *    passport.authorize('twitter-authz', { failureRedirect: '/account' });
   *
   * @param {String} strategy
   * @param {Object} options
   * @return {Function} middleware
   * @api public
   */

  public authorize<StrategyOrStrategies extends string | Strategy | (string | Strategy)[]>(
    strategy: StrategyOrStrategies,
    callback?: AuthenticateCallback<StrategyOrStrategies>
  ): RouteHandlerMethod
  public authorize<StrategyOrStrategies extends string | Strategy | (string | Strategy)[]>(
    strategy: StrategyOrStrategies,
    options?: AuthenticateOptions
  ): RouteHandlerMethod
  public authorize<StrategyOrStrategies extends string | Strategy | (string | Strategy)[]>(
    strategy: StrategyOrStrategies,
    options?: AuthenticateOptions,
    callback?: AuthenticateCallback<StrategyOrStrategies>
  ): RouteHandlerMethod
  public authorize<StrategyOrStrategies extends string | Strategy | (string | Strategy)[]>(
    strategyOrStrategies: StrategyOrStrategies,
    optionsOrCallback?: AuthenticateOptions | AuthenticateCallback<StrategyOrStrategies>,
    callback?: AuthenticateCallback<StrategyOrStrategies>
  ): RouteHandlerMethod {
    let options: AuthenticateOptions | undefined
    if (typeof optionsOrCallback == 'function') {
      options = {}
      callback = optionsOrCallback
    } else {
      options = optionsOrCallback
    }
    options || (options = {})
    options.assignProperty = 'account'

    return new AuthenticationRoute(this, strategyOrStrategies, options, callback).handler
  }

  /**
   * Hook or handler that will restore login state from a session managed by @fastify/secure-session.
   *
   * Web applications typically use sessions to maintain login state between requests.  For example, a user will authenticate by entering credentials into a form which is submitted to the server.  If the credentials are valid, a login session is established by setting a cookie containing a session identifier in the user's web browser.  The web browser will send this cookie in subsequent requests to the server, allowing a session to be maintained.
   *
   * If sessions are being utilized, and a login session has been established, this middleware will populate `request.user` with the current user.
   *
   * Note that sessions are not strictly required for Passport to operate. However, as a general rule, most web applications will make use of sessions. An exception to this rule would be an API server, which expects each HTTP request to provide credentials in an Authorization header.
   *
   * Examples:
   *
   *     server.register(FastifySecureSession);
   *     server.register(FastifyPassport.initialize());
   *     server.register(FastifyPassport.secureSession());
   *
   * Options:
   *   - `pauseStream`      Pause the request stream before deserializing the user
   *                        object from the session.  Defaults to _false_.  Should
   *                        be set to true in cases where middleware consuming the
   *                        request body is configured after passport and the
   *                        deserializeUser method is asynchronous.
   *
   * @return {Function} middleware
   */
  public secureSession(options?: AuthenticateOptions): FastifyPluginAsync {
    return fastifyPlugin(async (fastify) => {
      fastify.addHook('preValidation', new AuthenticationRoute(this, 'session', options).handler)
    })
  }

  /**
   * Registers a function used to serialize user objects into the session.
   *
   * Examples:
   *
   *     passport.registerUserSerializer(async (user) => user.id);
   *
   * @api public
   */
  registerUserSerializer<TUser, TID>(fn: SerializeFunction<TUser, TID>) {
    this.serializers.push(fn)
  }

  /** Runs the chain of serializers to find the first one that serializes a user, and returns it. */
  async serializeUser<User, StoredUser = any>(user: User, request: FastifyRequest): Promise<StoredUser> {
    const result = await this.runStack(this.serializers, user, request)

    if (result) {
      return result
    } else {
      throw new Error(`Failed to serialize user into session. Tried ${this.serializers.length} serializers.`)
    }
  }

  /**
   * Registers a function used to deserialize user objects out of the session.
   *
   * Examples:
   *
   *     fastifyPassport.registerUserDeserializer(async (id) => {
   *       return await User.findById(id);
   *     });
   *
   * @api public
   */
  registerUserDeserializer<User, StoredUser>(fn: DeserializeFunction<User, StoredUser>) {
    this.deserializers.push(fn)
  }

  async deserializeUser<StoredUser>(stored: StoredUser, request: FastifyRequest): Promise<StoredUser | false> {
    const result = await this.runStack(this.deserializers, stored, request)

    if (result) {
      return result
    } else if (result === null || result === false) {
      return false
    } else {
      throw new Error(`Failed to deserialize user out of session. Tried ${this.deserializers.length} serializers.`)
    }
  }

  /**
   * Registers a function used to transform auth info.
   *
   * In some circumstances authorization details are contained in authentication credentials or loaded as part of verification.
   *
   * For example, when using bearer tokens for API authentication, the tokens may encode (either directly or indirectly in a database), details such as scope of access or the client to which the token was issued.
   *
   * Such authorization details should be enforced separately from authentication. Because Passport deals only with the latter, this is the responsibility of middleware or routes further along the chain.  However, it is not optimal to decode the same data or execute the same database query later.  To avoid this, Passport accepts optional `info` along with the authenticated `user` in a strategy's `success()` action.  This info is set at `request.authInfo`, where said later middlware or routes can access it.
   *
   * Optionally, applications can register transforms to process this info, which take effect prior to `request.authInfo` being set.  This is useful, forexample, when the info contains a client ID.  The transform can load the client from the database and include the instance in the transformed info, allowing the full set of client properties to be convieniently accessed.
   *
   * If no transforms are registered, `info` supplied by the strategy will be left unmodified.
   *
   * Examples:
   *
   *     fastifyPassport.registerAuthInfoTransformer(async (info) => {
   *       info.client = await Client.findById(info.clientID);
   *       return info;
   *     });
   *
   * @api public
   */
  registerAuthInfoTransformer(fn: InfoTransformerFunction) {
    this.infoTransformers.push(fn)
  }

  async transformAuthInfo(info: any, request: FastifyRequest) {
    const result = await this.runStack(this.infoTransformers, info, request)
    // if no transformers are registered (or they all pass), the default behavior is to use the un-transformed info as-is
    return result || info
  }

  /**
   * Return strategy with given `name`.
   *
   * @param {String} name
   * @return {AnyStrategy}
   * @api private
   */
  strategy(name: string): AnyStrategy | undefined {
    return this.strategies[name]
  }

  private async runStack<Result, A, B>(stack: ((...args: [A, B]) => Promise<Result>)[], ...args: [A, B]) {
    for (const attempt of stack) {
      try {
        return await attempt(...args)
      } catch (e) {
        if (e == 'pass') {
          continue
        } else {
          throw e
        }
      }
    }
  }
}

export default Authenticator
