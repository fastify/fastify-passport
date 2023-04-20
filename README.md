# @fastify/passport

[![CI](https://github.com/fastify/fastify-passport/workflows/CI/badge.svg)](https://github.com/fastify/fastify-passport/actions/workflows/ci.yml)
[![NPM version](https://img.shields.io/npm/v/@fastify/passport.svg?style=flat)](https://www.npmjs.com/package/@fastify/passport)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat)](https://github.com/prettier/prettier)

`@fastify/passport` is a port of [`passport`](http://www.passportjs.org/) for the Fastify ecosystem. It lets you use Passport strategies to authenticate requests and protect Fastify routes!

## Status

Beta. `@fastify/passport` is still a relatively new project. There may be incompatibilities with express-based `passport` deployments, and bugs. Please report any issues so we can correct them!

## Installation

```shell
npm i @fastify/passport
```

## Google OAuth2 Video tutorial

The community created this fast introduction to `@fastify/passport`:
[![Google OAuth2 Tutorial Passport](https://img.youtube.com/vi/XRcQQWU0XOM/0.jpg)](https://youtu.be/XRcQQWU0XOM)


## Example

```js
import fastifyPassport from '@fastify/passport'
import fastifySecureSession from '@fastify/secure-session'

const server = fastify()
// set up secure sessions for @fastify/passport to store data in
server.register(fastifySecureSession, { key: fs.readFileSync(path.join(__dirname, 'secret-key')) })
// initialize @fastify/passport and connect it to the secure-session storage. Note: both of these plugins are mandatory.
server.register(fastifyPassport.initialize())
server.register(fastifyPassport.secureSession())

// register an example strategy for fastifyPassport to authenticate users using
fastifyPassport.use('test', new SomePassportStrategy()) // you'd probably use some passport strategy from npm here

// Add an authentication for a route which will use the strategy named "test" to protect the route
server.get(
  '/',
  { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
  async () => 'hello world!'
)

// Add an authentication for a route which will use the strategy named "test" to protect the route, and redirect on success to a particular other route.
server.post(
  '/login',
  { preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: false }) },
  () => {}
)

server.listen()
```

Alternatively, [`@fastify/session`](https://github.com/fastify/session) is also supported and works out of the box for session storage.  
Here's an example:

```js
import { Authenticator } from '@fastify/passport'
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'

const server = fastify()

// setup an Authenticator instance which uses @fastify/session
const fastifyPassport = new Authenticator()

server.register(fastifyCookie)
server.register(fastifySession, { secret: 'secret with minimum length of 32 characters' })

// initialize @fastify/passport and connect it to the secure-session storage. Note: both of these plugins are mandatory.
server.register(fastifyPassport.initialize())
server.register(fastifyPassport.secureSession())

// register an example strategy for fastifyPassport to authenticate users using
fastifyPassport.use('test', new SomePassportStrategy()) // you'd probably use some passport strategy from npm here
```

## Session cleanup on logIn

For security reasons the session is cleaned after login. You can manage this configuration at your own risk by using
`clearSessionOnLogin (default: true)` and `clearSessionIgnoreFields (default: ['passport', 'session'])`

## Difference between `@fastify/secure-session` and `@fastify/session`
`@fastify/secure-session` and `@fastify/session` are both session plugins for Fastify which are capable of encrypting/decrypting the session. The main difference is that `@fastify/secure-session` uses the stateless approach and stores the whole session in an encrypted cookie whereas `@fastify/session` uses the stateful approach for sessions and stores them in a session store.

## Session Serialization

In a typical web application, the credentials used to authenticate a user will only be transmitted once when a user logs in, and after, they are considered logged in because of some data stored in their session. `@fastify/passport` implements this pattern by storing sessions using `@fastify/secure-session`, and serializing/deserializing user objects to and from the session referenced by the cookie. `@fastify/passport` cannot store rich object classes in the session, only JSON objects, so you must register a serializer / deserializer pair if you want to say fetch a User object from your database, and store only a user ID in the session.

```js
// register a serializer that stores the user object's id in the session ...
fastifyPassport.registerUserSerializer(async (user, request) => user.id);

// ... and then a deserializer that will fetch that user from the database when a request with an id in the session arrives
fastifyPassport.registerUserDeserializer(async (id, request) => {
  return await User.findById(id);
});
```

## API

### initialize()

A hook that **must be added**. Sets up a `@fastify/passport` instance's hooks.

### secureSession()

A hook that **must be added**. Sets up `@fastify/passport`'s connector with `@fastify/secure-session` to store authentication in the session.

### authenticate(strategy: string | Strategy | (string | Strategy)[], options: AuthenticateOptions, callback?: AuthenticateCallback)

Returns a hook that authenticates requests, in other words, validates users and then signs them in. `authenticate` is intended for use as a `preValidation` hook on a particular route like `/login`.

Applies the given strategy (or strategies) to the incoming request, in order to authenticate the request. Strategies are usually registered ahead of time using `.use`, and then passed to `.authenticate` by name. If authentication is successful, the user will be logged in and populated at `request.user` and a session will be established by default. If authentication fails, an unauthorized response will be sent.

Strategies or arrays of strategies can also be passed as instances. This is useful when using a temporary strategy you only intend to use once for one user and don't want to register into the global list of available strategies.

Options:

- `session` Save login state in session, defaults to _true_
- `successRedirect` After successful login, redirect to given URL
- `successMessage` True to store success message in
  req.session.messages, or a string to use as override
  message for success.
- `successFlash` True to flash success messages or a string to use as a flash
  message for success (overrides any from the strategy itself).
- `failureRedirect` After failed login, redirect to given URL
- `failureMessage` True to store failure message in
  req.session.messages, or a string to use as override
  message for failure.
- `failureFlash` True to flash failure messages or a string to use as a flash
  message for failures (overrides any from the strategy itself).
- `assignProperty` Assign the object provided by the verify callback to given property
- `state` Pass any provided state through to the strategy (e.g. for Google Oauth)

An optional `callback` can be supplied to allow the application to override the default manner in which authentication attempts are handled. The callback has the following signature:

```js
(request, reply, err | null, user | false, info?, (status | statuses)?) => Promise<void>
```

where `request` and `reply` will be set to the original `FastifyRequest` and `FastifyReply` objects, and `err` will be set to `null` in case of a success or an `Error` object in case of a failure. If `err` is not `null` then `user`, `info` and `status` objects will be `undefined`. The `user` object will be set to the authenticated user on a successful authentication attempt, or `false` otherwise.

An optional `info` argument will be passed, containing additional details provided by the strategy's verify callback - this could be information about a successful authentication or a challenge message for a failed authentication.

An optional `status` or `statuses` argument will be passed when authentication fails - this could be a HTTP response code for a remote authentication failure or similar.

```js
fastify.get(
  '/',
  { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
  async (request, reply, err, user, info, status) => {
    if (err !== null) {
      console.warn(err)
    } else if (user) {
      console.log(`Hello ${user.name}!`)
    }
  }
)
```

Examples:

```js
// create a request handler that uses the facebook strategy
fastifyPassport.use(new FacebookStrategy('facebook', {
  // options for the facebook strategy, see https://www.npmjs.com/package/passport-facebook
})))
fastifyPassport.authenticate('facebook');

// create a request handler to test against the strategy named local, and automatically redirect when it succeeds or fails
fastifyPassport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' });

// create a request handler that won't use any user information stored in the secure session
fastifyPassport.authenticate('basic', { session: false });
```

Note that if a callback is supplied, it becomes the application's responsibility to log-in the user, establish a session, and otherwise perform the desired operations.

#### Multiple Strategies

`@fastify/passport` supports authenticating with a list of strategies, and will try each in order until one passes. Pass an array of strategy names to `authenticate` for this:

```js
// somewhere before several strategies are registered
fastifyPassport.use('bearer', new BearerTokenStrategy())
fastifyPassport.use('basic', new BasicAuthStrategy())
fastifyPassport.use('google', new FancyGoogleStrategy())

// and then an `authenticate` call can test incoming requests against multiple strategies
fastify.get(
  '/',
  { preValidation: fastifyPassport.authenticate(['bearer', 'basic', 'google'], { authInfo: false }) },
  async (request, reply, err, user, info, status) => {
    if (err !== null) {
      console.warn(err)
    } else if (user) {
      console.log(`Hello ${user.name}!`)
    }
  }
)
```

Note that multiple strategies that redirect to start an authentication flow, like OAuth2 strategies from major platforms, shouldn't really be used together in the same `authenticate` call. This is because `@fastify/passport` will run the strategies in order, and the first one that redirects will do so, preventing the user from ever using the other strategies. To set up multiple OAuth2 strategies, add several routes that each use a different strategy in their own `authenticate` call, and then direct users to the right route for the strategy they pick.

Multiple strategies can also be passed as instances if you only intend to use them for that route handler or for that request.

```js
// use an `authenticate` call can test incoming requests against multiple strategies without registering them for use elsewhere
fastify.get(
  '/',
  {
    preValidation: fastifyPassport.authenticate([new BearerTokenStrategy(), new BasicAuthStrategy()], {
      authInfo: false,
    }),
  },
  async (request, reply, err, user, info, status) => {
    if (err !== null) {
      console.warn(err)
    } else if (user) {
      console.log(`Hello ${user.name}!`)
    }
  }
)
```

### authorize(strategy: string | Strategy | (string | Strategy)[], options: AuthenticateOptions = {}, callback?: AuthenticateCallback)

Returns a hook that will authorize a third-party account using the given `strategy`, with optional `options`. Intended for use as a `preValidation` hook on any route. `.authorize` has the same API as `.authenticate`, but has one key difference: it doesn't modify the logged in user's details. Instead, if authorization is successful, the result provided by the strategy's verify callback will be assigned to `request.account`. The existing login session and `request.user` will be unaffected.

This function is particularly useful when connecting third-party accounts to the local account of a user that is currently authenticated.

Examples:

```js
fastifyPassport.authorize('twitter-authz', { failureRedirect: '/account' })
```

`.authorize` allows the use of multiple strategies by passing an array of strategy names, and allows the use of already instantiated Strategy instances by passing the instance as the strategy, or an array of instances.

### use(name?: string, strategy: Strategy)

Utilize the given `strategy` with optional `name`, overridding the strategy's default name.

Examples:

```js
fastifyPassport.use(new TwitterStrategy(...));

fastifyPassport.use('api', new http.Strategy(...));
```

### unuse(name: string)

Un-utilize the `strategy` with given `name`.

In typical applications, the necessary authentication strategies are static, configured once and always available. As such, there is often no need to invoke this function.

However, in certain situations, applications may need dynamically configure and de-configure authentication strategies. The `use()`/`unuse()` combination satisfies these scenarios.

Example:

```js
fastifyPassport.unuse('legacy-api')
```

### registerUserSerializer(serializer: (user, request) => Promise<SerializedUser>)

Registers an async user serializer function for taking a high level User object from your application and serializing it for storage into the session. `@fastify/passport` cannot store rich object classes in the session, only JSON objects, so you must register a serializer / deserializer pair if you want to say fetch a User object from your database, and store only a user ID in the session.

```js
// register a serializer that stores the user object's id in the session ...
fastifyPassport.registerUserSerializer(async (user, request) => user.id)
```

### registerUserDeserializer(deserializer: (serializedUser, request) => Promise<User>)

Registers an async user deserializer function for taking a low level serialized user object (often just a user ID) from a session, and deserializing it from storage into the request context. `@fastify/passport` cannot store rich object classes in the session, only JSON objects, so you must register a serializer / deserializer pair if you want to say fetch a User object from your database, and store only a user ID in the session.

```js
fastifyPassport.registerUserDeserializer(async (id, request) => {
  return await User.findById(id);
});
```

Deserializers can throw the string `"pass"` if they do not apply to the current session and the next deserializer should be tried. This is useful if you are using `@fastify/passport` to store two different kinds of user objects. An example:

```js
// register a deserializer for database users
fastifyPassport.registerUserDeserializer(async (id, request) => {
  if (id.startsWith("db-")) {
    return await User.findById(id);
  } else {
    throw "pass"
  }
});

// register a deserializer for redis users
fastifyPassport.registerUserDeserializer(async (id, request) => {
  if (id.startsWith("redis-")) {
    return await redis.get(id);
  } else {
    throw "pass"
  }
});
```

Sessions may specify serialized users that have since been deleted from the datastore storing them for the application. In that case, deserialization often fails because the user row cannot be found for a given id. Depending on the application, this can either be an error condition, or expected if users are deleted from the database while logged in. `@fastify/passport`'s behaviour in this case is configurable. Errors are thrown if a deserializer returns undefined, and the session is logged out if a deserializer returns `null` or `false.` This matches the behaviour of the original `passport` module.

Therefore, a deserializer can return several things:

- if a deserializer returns an object, that object is assumed to be a successfully deserialized user
- if a deserializer returns `undefined`, `@fastify/passport` interprets that as an erroneously missing user, and throws an error because the user could not be deserialized.
- if a deserializer returns `null` or `false`, `@fastify/passport` interprets that as a missing but expected user, and resets the session to log the user out
- if a deserializer throws the string `"pass"`, `@fastify/passport` will try the next deserializer if it exists, or throw an error because the user could not be deserialized.

### Request#isUnauthenticated()

Test if request is unauthenticated.

## Using with TypeScript

`@fastify/passport` is written in TypeScript, so it includes type definitions for all of it's API. You can also strongly type the `FastifyRequest.user` property using TypeScript declaration merging. You must re-declare the `PassportUser` interface in the `fastify` module within your own code to add the properties you expect to be assigned by the strategy when authenticating:

```typescript
declare module 'fastify' {
  interface PassportUser {
    id: string
  }
}
```

or, if you already have a type for the objects returned from all of the strategies, you can make `PassportUser` extend it:

```typescript
import { User } from './my/types'

declare module 'fastify' {
  interface PassportUser extends User {}
}
```

## Using multiple instances

`@fastify/passport` supports being registered multiple times in different plugin encapsulation contexts. This is useful to implement two separate authentication stacks. For example, you might have a set of strategies that authenticate users of your application, and a whole other set of strategies for authenticating staff members of your application that access an administration area. Users might be stored at `request.user`, and administrators at `request.admin`, and logging in as one should have no bearing on the other. It is important to register each instance of `@fastify/passport` in a different Fastify plugin context so that the decorators `@fastify/passport` like `request.logIn` and `request.logOut` do not collide.

To register @fastify/passport more than once, you must instantiate more copies with different `keys` and `userProperty`s so they do not collide when decorating your fastify instance or storing things in the session.

```typescript
import { Authenticator } from '@fastify/passport'

const server = fastify()

// setup an Authenticator instance for users that stores the login result at `request.user`
const userPassport = new Authenticator({ key: 'users', userProperty: 'user' })
userPassport.use('some-strategy', new CoolOAuthStrategy('some-strategy'))
server.register(userPassport.initialize())
server.register(userPassport.secureSession())

// setup an Authenticator instance for users that stores the login result at `request.admin`
const adminPassport = new Authenticator({ key: 'admin', userProperty: 'admin' })
adminPassport.use('admin-google', new GoogleOAuth2Strategy('admin-google'))
server.register(adminPassport.initialize())
server.register(adminPassport.secureSession())

// protect some routes with the userPassport
server.get(
  `/`,
  { preValidation: userPassport.authenticate('some-strategy') },
  async () => `hello ${JSON.serialize(request.user)}!`
)

// and protect others with the adminPassport
server.get(
  `/admin`,
  { preValidation: adminPassport.authenticate('admin-google') },
  async () => `hello administrator ${JSON.serialize(request.admin)}!`
)
```

**Note**: Each `Authenticator` instance's initialize plugin and session plugin must be registered separately.

It is important to note that using multiple `@fastify/passport` instances is not necessary if you want to use multiple strategies to login the same type of user. `@fastify/passport` supports multiple strategies by passing an array to any `.authenticate` call.

# Differences from Passport.js

`@fastify/passport` is an adapted version of Passport that tries to be as compatible as possible, but is an adapted version that has some incompatibilities. Passport strategies that adhere to the passport strategy API should work fine, but there are some differences in other APIs made to integrate better with Fastify and to stick with Fastify's theme of performance.

Differences:

- `serializeUser` renamed to `registerUserSerializer` and always takes an async function with the signature `(user: User, request: FastifyRequest) => Promise<SerializedUser>`
- `deserializeUser` renamed to `registerUserDeserializer` and always takes an async function with the signature `(serialized: SerializedUser, request: FastifyRequest) => Promise<User>`
- `transformAuthInfo` renamed to `registerAuthInfoTransformer` and always takes an async function with the signature `(info: any, request: FastifyRequest) => Promise<any>`
- `.authenticate` and `.authorize` accept strategy instances in addition to strategy names. This allows for using one time strategy instances (say for testing given user credentials) without adding them to the global list of registered strategies.

## License

[MIT](./LICENSE)
