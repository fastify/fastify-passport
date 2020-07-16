import { SecureSessionManager } from "./session-managers/SecureSessionManager";
import { Strategy, SessionStrategy } from "./strategies";
import { FastifyRequest } from "fastify";
import authenticateFactory, { AuthenticateFactoryOptions } from "./handlers/authenticate";
import initializeFactory from "./handlers/initialize";
import fastifyPlugin from "fastify-plugin";

export type DoneFunction = (err: undefined | null | Error | "pass", user?: any) => void;
export type SerializeFunction<TUser = any, TID = any> =
  | ((user: TUser, done: (err: any, id?: TID) => void) => void)
  | ((req: FastifyRequest, user: TUser, done: (err: any, id?: TID) => void) => void);
export type DeserializeFunction<TUser = any, TID = any> =
  | ((id: TID, done: (err: any, user?: TUser) => void) => void)
  | ((req: FastifyRequest, id: TID, done: (err: any, user?: TUser) => void) => void);

export type InfoTransformerFunction = ((info: any, done: (err: any, info: any) => void) => void) | ((info: any) => any);

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

  public initialize(options?: { userProperty?: string }) {
    return initializeFactory(this, options);
  }

  public authenticate(strategy: string, options?: AuthenticateFactoryOptions, callback?) {
    return authenticateFactory(this, strategy, options, callback);
  }

  authorize(strategy: string, options?: any, callback?) {
    options = options || {};
    options.assignProperty = "account";

    return authenticateFactory(this, strategy, options, callback);
  }

  /**
   * Middleware that will restore login state from a session managed by fastify-secure-session.
   *
   * Web applications typically use sessions to maintain login state between requests.  For example, a user will authenticate by entering credentials into a form which is submitted to the server.  If the credentials are valid, a login session is established by setting a cookie containing a session identifier in the user's web browser.  The web browser will send this cookie in subsequent requests to the server, allowing a session to be maintained.
   *
   * If sessions are being utilized, and a login session has been established, this middleware will populate `req.user` with the current user.
   *
   * Note that sessions are not strictly required for Passport to operate. However, as a general rule, most web applications will make use of sessions. An exception to this rule would be an API server, which expects each HTTP request to provide credentials in an Authorization header.
   *
   * Examples:
   *
   *     app.use(connect.cookieParser());
   *     app.use(connect.session({ secret: 'keyboard cat' }));
   *     app.use(passport.initialize());
   *     app.use(passport.secureSession());
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
  public secureSession(options?: AuthenticateFactoryOptions) {
    const authenticate: any = authenticateFactory(this, "session", options);
    return fastifyPlugin(function session(fastify, opts, next) {
      fastify.addHook("preValidation", authenticate);
      next();
    });
  }

  /**
   * Registers a function used to serialize user objects into the session.
   *
   * Examples:
   *
   *     passport.serializeUser(function(user, done) {
   *       done(null, user.id);
   *     });
   *
   * @api public
   */
  serializeUser<TUser, TID>(fn: SerializeFunction<TUser, TID>): void;
  serializeUser<TUser>(user: TUser, req: FastifyRequest, done: DoneFunction): void;
  serializeUser(fnOrUser, req?, done?) {
    if (typeof fnOrUser === "function") {
      this._serializers.push(fnOrUser);
      return;
    }

    // private implementation that actually invokes the serializer chain attempting to serialize a user
    const user = fnOrUser;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    done = done!;
    const stack = this._serializers;

    (function pass(index: number, err?: null | "pass" | Error, obj?: any) {
      // serializers use 'pass' as an error to skip processing
      if ("pass" === err) {
        err = undefined;
      }
      // an error or serialized object was obtained, done
      if (err || obj || obj === 0) {
        return done(err, obj);
      }

      const layer = stack[index];
      if (!layer) {
        return done(new Error("Failed to serialize user into session"));
      }

      const innerDone = (innerError: Error, innerOutput: any) => pass(index + 1, innerError, innerOutput);

      try {
        const arity = layer.length;
        if (arity === 3) {
          layer(req, user, innerDone);
        } else {
          (layer as any)(user, innerDone);
        }
      } catch (e) {
        return done(e);
      }
    })(0);
  }

  /**
   * Registers a function used to deserialize user objects out of the session.
   *
   * Examples:
   *
   *     passport.deserializeUser(function(id, done) {
   *       User.findById(id, function (err, user) {
   *         done(err, user);
   *       });
   *     });
   *
   * @api public
   */
  deserializeUser<TUser, TID>(fn: DeserializeFunction<TUser, TID>): void;
  deserializeUser<TUser>(obj, req: FastifyRequest, done: DoneFunction): void;
  deserializeUser(fnOrObj, req?: FastifyRequest, done?: DoneFunction): void {
    if (typeof fnOrObj === "function") {
      this._deserializers.push(fnOrObj);
      return;
    }

    // private implementation that traverses the chain of deserializers,
    // attempting to deserialize a user
    const obj = fnOrObj;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    done = done!;

    const stack = this._deserializers;
    (function pass(index: number, err?: undefined | null | "pass" | Error, user?: any) {
      // deserializers use 'pass' as an error to skip processing
      if ("pass" === err) {
        err = undefined;
      }
      // an error or deserialized user was obtained, done
      if (err || user) {
        return done(err, user);
      }
      // a valid user existed when establishing the session, but that user has
      // since been removed
      if (user === null || user === false) {
        return done(null, false);
      }

      const layer = stack[index];
      if (!layer) {
        return done(new Error("Failed to deserialize user out of session"));
      }

      const innerDone = (e: any, u: any) => pass(index + 1, e, u);

      try {
        const arity = layer.length;
        if (arity === 3) {
          layer(req, obj, innerDone);
        } else {
          (layer as any)(obj, innerDone);
        }
      } catch (e) {
        return done(e);
      }
    })(0);
  }

  /**
   * Registers a function used to transform auth info.
   *
   * In some circumstances authorization details are contained in authentication
   * credentials or loaded as part of verification.
   *
   * For example, when using bearer tokens for API authentication, the tokens may
   * encode (either directly or indirectly in a database), details such as scope
   * of access or the client to which the token was issued.
   *
   * Such authorization details should be enforced separately from authentication.
   * Because Passport deals only with the latter, this is the responsiblity of
   * middleware or routes further along the chain.  However, it is not optimal to
   * decode the same data or execute the same database query later.  To avoid
   * this, Passport accepts optional `info` along with the authenticated `user`
   * in a strategy's `success()` action.  This info is set at `req.authInfo`,
   * where said later middlware or routes can access it.
   *
   * Optionally, applications can register transforms to proccess this info,
   * which take effect prior to `req.authInfo` being set.  This is useful, for
   * example, when the info contains a client ID.  The transform can load the
   * client from the database and include the instance in the transformed info,
   * allowing the full set of client properties to be convieniently accessed.
   *
   * If no transforms are registered, `info` supplied by the strategy will be left
   * unmodified.
   *
   * Examples:
   *
   *     passport.transformAuthInfo(function(info, done) {
   *       Client.findById(info.clientID, function (err, client) {
   *         info.client = client;
   *         done(err, info);
   *       });
   *     });
   *
   * @api public
   */
  transformAuthInfo(fn: InfoTransformerFunction): void;
  transformAuthInfo(obj: any, request: FastifyRequest, done: DoneFunction): void;
  transformAuthInfo(fn, req?: FastifyRequest, done?: DoneFunction): void {
    if (typeof fn === "function") {
      this._infoTransformers.push(fn);
      return;
    }

    // private implementation that traverses the chain of transformers,
    // attempting to transform auth info
    const info = fn;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    done = done!;

    const stack = this._infoTransformers;
    (function pass(index, err, tinfo) {
      // transformers use 'pass' as an error to skip processing
      if ("pass" === err) {
        err = undefined;
      }
      // an error or transformed info was obtained, done
      if (err || tinfo) {
        return done(err, tinfo);
      }

      const layer = stack[index];
      if (!layer) {
        // if no transformers are registered (or they all pass), the default
        // behavior is to use the un-transformed info as-is
        return done(null, info);
      }

      function transformed(e: any, t: any) {
        pass(index + 1, e, t);
      }

      try {
        const arity = layer.length;
        if (arity === 1) {
          // sync
          const t = (layer as any)(info);
          transformed(null, t);
        } else if (arity === 3) {
          (layer as any)(req, info, transformed);
        } else {
          layer(info, transformed);
        }
      } catch (e) {
        return done(e);
      }
    })(0);
  }

  /**
   * Return strategy with given `name`.
   *
   * @param {String} name
   * @return {Strategy}
   * @api private
   */
  _strategy(name: string): Strategy {
    return this._strategies[name];
  }
}

export default Authenticator;
