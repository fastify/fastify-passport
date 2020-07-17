import { SecureSessionManager } from "./session-managers/SecureSessionManager";
import { Strategy, SessionStrategy } from "./strategies";
import { FastifyRequest, RouteHandlerMethod, FastifyPlugin } from "fastify";
import { AuthenticateOptions, AuthenticateCallback, AuthenticationRoute } from "./routes/AuthenticationRoute";
import initializeFactory from "./routes/initialize";
import fastifyPlugin from "fastify-plugin";

export type SerializeFunction<User = any, SerializedUser = any> = (
  user: User,
  req: FastifyRequest
) => Promise<SerializedUser>;

export type DeserializeFunction<SerializedUser = any, User = any> = (
  serialized: SerializedUser,
  req: FastifyRequest
) => Promise<User>;

export type InfoTransformerFunction = (info: any) => Promise<any>;

export class Authenticator {
  private _strategies: { [k: string]: Strategy } = {};
  private _serializers: SerializeFunction<any, any>[] = [];
  private _deserializers: DeserializeFunction<any, any>[] = [];
  private _infoTransformers: InfoTransformerFunction[] = [];
  public _key = "passport";
  public _userProperty = "user";
  public _sessionManager: SecureSessionManager;

  constructor() {
    this.use(new SessionStrategy(this.deserializeUser.bind(this)));
    this._sessionManager = new SecureSessionManager({ key: this._key }, this.serializeUser.bind(this));
  }

  use(strategy: Strategy): this;
  use(name: string, strategy: Strategy): this;
  use(name: Strategy | string, strategy?: Strategy): this {
    if (!strategy) {
      strategy = name as Strategy;
      name = strategy.name as string;
    }
    if (!name) {
      throw new Error("Authentication strategies must have a name");
    }

    this._strategies[name as string] = strategy;
    return this;
  }

  public unuse(name: string): this {
    delete this._strategies[name];
    return this;
  }

  public initialize(options?: { userProperty?: string }): FastifyPlugin {
    return initializeFactory(this, options);
  }

  /**
   * Hook or handler that will authenticate a request using the given `strategy` name,
   * with optional `options` and `callback`.
   *
   * Examples:
   *
   *     passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' })(req, res);
   *
   *     passport.authenticate('local', function(err, user) {
   *       if (!user) { return res.redirect('/login'); }
   *       res.end('Authenticated!');
   *     })(req, res);
   *
   *     passport.authenticate('basic', { session: false })(req, res);
   *
   *     app.get('/auth/twitter', passport.authenticate('twitter'), function(req, res) {
   *       // request will be redirected to Twitter
   *     });
   *     app.get('/auth/twitter/callback', passport.authenticate('twitter'), function(req, res) {
   *       res.json(request.user);
   *     });
   *
   * @param {String} strategy
   * @param {Object} options
   * @param {Function} callback
   * @return {Function} handler
   * @api public
   */
  public authenticate<StrategyName extends string | string[]>(
    strategy: StrategyName,
    callback?: AuthenticateCallback<StrategyName>
  ): RouteHandlerMethod;
  public authenticate<StrategyName extends string | string[]>(
    strategy: StrategyName,
    options?: AuthenticateOptions
  ): RouteHandlerMethod;
  public authenticate<StrategyName extends string | string[]>(
    strategy: StrategyName,
    options?: AuthenticateOptions,
    callback?: AuthenticateCallback<StrategyName>
  ): RouteHandlerMethod;
  public authenticate<StrategyName extends string | string[]>(
    strategyOrStrategies: StrategyName,
    optionsOrCallback?: AuthenticateOptions | AuthenticateCallback<StrategyName>,
    callback?: AuthenticateCallback<StrategyName>
  ): RouteHandlerMethod {
    let options;
    if (typeof optionsOrCallback == "function") {
      options = {};
      callback = optionsOrCallback;
    } else {
      options = optionsOrCallback;
    }

    return new AuthenticationRoute(this, strategyOrStrategies, options, callback).handler;
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
  public authorize<StrategyName extends string | string[]>(
    strategy: StrategyName,
    callback?: AuthenticateCallback<StrategyName>
  );
  public authorize<StrategyName extends string | string[]>(strategy: StrategyName, options?: AuthenticateOptions);
  public authorize<StrategyName extends string | string[]>(
    strategy: StrategyName,
    options?: AuthenticateOptions,
    callback?: AuthenticateCallback<StrategyName>
  );
  public authorize<StrategyName extends string | string[]>(
    strategyOrStrategies: StrategyName,
    optionsOrCallback?: AuthenticateOptions | AuthenticateCallback<StrategyName>,
    callback?: AuthenticateCallback<StrategyName>
  ) {
    let options;
    if (typeof optionsOrCallback == "function") {
      options = {};
      callback = optionsOrCallback;
    } else {
      options = optionsOrCallback;
    }
    options.assignProperty = "account";

    return new AuthenticationRoute(this, strategyOrStrategies, options, callback).handler;
  }

  /**
   * Hook or handler that will restore login state from a session managed by fastify-secure-session.
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
  public secureSession(options?: AuthenticateOptions): FastifyPlugin {
    return fastifyPlugin(async (fastify) => {
      fastify.addHook("preValidation", new AuthenticationRoute(this, "session", options).handler);
    });
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
    this._serializers.push(fn);
  }

  /** Runs the chain of serializers to find the first one that serializes a user, and returns it. */
  async serializeUser<User, StoredUser = any>(user: User, request: FastifyRequest): Promise<StoredUser> {
    const result = this.runStack(this._serializers, user, request);

    if (result) {
      return result;
    } else {
      throw new Error(`Failed to serialize user into session. Tried ${this._serializers.length} serializers.`);
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
    this._deserializers.push(fn);
  }

  async deserializeUser<StoredUser>(stored: StoredUser, request: FastifyRequest) {
    const result = this.runStack(this._deserializers, stored, request);

    if (result) {
      return result;
    } else {
      throw new Error(`Failed to deserialize user out of session. Tried ${this._deserializers.length} serializers.`);
    }
  }

  /**
   * Registers a function used to transform auth info.
   *
   * In some circumstances authorization details are contained in authentication credentials or loaded as part of verification.
   *
   * For example, when using bearer tokens for API authentication, the tokens may encode (either directly or indirectly in a database), details such as scope of access or the client to which the token was issued.
   *
   * Such authorization details should be enforced separately from authentication. Because Passport deals only with the latter, this is the responsiblity of middleware or routes further along the chain.  However, it is not optimal to decode the same data or execute the same database query later.  To avoid this, Passport accepts optional `info` along with the authenticated `user` in a strategy's `success()` action.  This info is set at `request.authInfo`, where said later middlware or routes can access it.
   *
   * Optionally, applications can register transforms to proccess this info, which take effect prior to `request.authInfo` being set.  This is useful, forexample, when the info contains a client ID.  The transform can load the client from the database and include the instance in the transformed info, allowing the full set of client properties to be convieniently accessed.
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
    this._infoTransformers.push(fn);
  }

  transformAuthInfo(info: any, request: FastifyRequest) {
    const result = this.runStack(this._infoTransformers, info, request);
    // if no transformers are registered (or they all pass), the default behavior is to use the un-transformed info as-is
    return result || info;
  }

  /**
   * Return strategy with given `name`.
   *
   * @param {String} name
   * @return {Strategy}
   * @api private
   */
  strategy(name: string): Strategy {
    return this._strategies[name];
  }

  private async runStack<Result, A, B>(stack: ((...args: [A, B]) => Promise<Result>)[], ...args: [A, B]) {
    for (const attempt of stack) {
      try {
        return await attempt(...args);
      } catch (e) {
        if (e == "pass") {
          continue;
        } else {
          throw e;
        }
      }
    }
  }
}

export default Authenticator;
