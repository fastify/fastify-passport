# fastify-passport

![Build Status](https://github.com/fastify/fastify-passport/workflows/ci/badge.svg)
[![NPM version](https://img.shields.io/npm/v/fastify-passport.svg?style=flat)](https://www.npmjs.com/package/fastify-passport)

`fastify-passport` is a port of the [`passport`](http://www.passportjs.org/) for the Fastify ecosystem. It lets you use Passport strategies to protect Fastify routes!

## Status

Alpha. Pre-any-release. There may be incompatabilities with express-based `passport` deployments, and bugs. Use at your own risk, but please report any issues so we can correct them!

## Installation

```shell
npm install fastify-passport
```

## Example

```js
import fastifyPassport from "fastify-passport";
import fastifySecureSession from "fastify-secure-session";

const server = fastify();
// set up secure sessions for fastify-passport to store data in
server.register(fastifySecureSession, { key: fs.readFileSync(path.join(__dirname, "secret-key")) });
// initialize fastify-passport and connect it to the secure-session storage. Note: both of these plugins are mandatory.
server.register(fastifyPassport.initialize());
server.register(fastifyPassport.secureSession());

// Add an authentication for a route which will use the strategy named "test" to protect the route
server.get(
  "/",
  { preValidation: fastifyPassport.authenticate("test", { authInfo: false }) },
  async () => "hello world!"
);

// Add an authentication for a route which will use the strategy named "test" to protect the route, and redirect on success to a particular other route.
server.post(
  "/login",
  { preValidation: fastifyPassport.authenticate("test", { successRedirect: "/", authInfo: false }) },
  () => {}
);

server.listen(0);
```

## API

### initialize()

A hook that **must be added**. Sets up a `fastify-passport` instance's hooks.

### secureSession()

A hook that **must be added**. Sets up `fastify-passport`'s connector with `fastify-secure-session` to store authentication in the session.

### authenticate(name, options)

Returns a hook that authenticates requests, in other words, validates users and then signs them in. `authenticate` is intended for use as a `preValidation` hook on a particular route like `/login`.

Applies the `name`ed strategy (or strategies) to the incoming request, in order to authenticate the request. If authentication is successful, the user will be logged in and populated at `request.user` and a session will be established by default. If authentication fails, an unauthorized response will be sent.

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

An optional `callback` can be supplied to allow the application to override the default manner in which authentication attempts are handled. The callback has the following signature:
```js
(request, reply, err | null, user | false, info?, (status | statuses)?) => Promise<void>
```
 where `request` and `reply` will be set to the original `FastifyRequest` and `FastifyReply` objects, and `err` will be set to `null` in case of a success or an `Error` object in case of a failure. If `err` is not `null` then `user`, `info` and `status` objects will be `undefined`. The `user` object will be set to the authenticated user on a successful authentication attempt, or `false` otherwise.

 An optional `info` argument will be passed, containing additional details provided by the strategy's verify callback - this could be information about a successful authentication or a challenge message for a failed authentication.

An optional `status` or `statuses` argument will be passed when authentication fails - this could be a HTTP response code for a remote authentication failure or similar.

```js
fastify.get(
  "/",
  { preValidation: fastifyPassport.authenticate("test", { authInfo: false }) },
  async (request, reply, err, user, info, status) => {
    if (err !== null) {
      console.warn(err)
    } else if (user) {
      console.log(`Hello ${user.name}!`)
    }
  }
);
```

Examples:

- `fastifyPassport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' });`
- `fastifyPassport.authenticate('basic', { session: false });`
- `fastifyPassport.authenticate('twitter');`

Note that if a callback is supplied, it becomes the application's responsibility to log-in the user, establish a session, and otherwise perform the desired operations.

### authorize(name, options)

Returns a hook that will authorize a third-party account using the given `strategy` name, with optional `options`. Intended for use as a `preValidation` hook on any route. `.authorize` has the same API as `.authenticate`, but has one key difference: it doesn't modify the logged in user's details. Instead, if authorization is successful, the result provided by the strategy's verify callback will be assigned to `request.account`. The existing login session and `request.user` will be unaffected.

This function is particularly useful when connecting third-party accounts to the local account of a user that is currently authenticated.

Examples:

```js
fastifyPassport.authorize("twitter-authz", { failureRedirect: "/account" });
```

### use([name], strategy)

Utilize the given `strategy` with optional `name`, overridding the strategy's default name.

Examples:

```js
fastifyPassport.use(new TwitterStrategy(...));

fastifyPassport.use('api', new http.Strategy(...));
```

### unuse(name)

Un-utilize the `strategy` with given `name`.

In typical applications, the necessary authentication strategies are static, configured once and always available. As such, there is often no need to invoke this function.

However, in certain situations, applications may need dynamically configure and de-configure authentication strategies. The `use()`/`unuse()` combination satisfies these scenarios.

Example:

```js
fastifyPassport.unuse("legacy-api");
```

### Request#isUnauthenticated()

Test if request is unauthenticated.

# Differences from Passport.js

`fastify-passport` is an adapted version of Passport that tries to be as compatible as possible, but is an adapted version that has some incompatabilities. Passport strategies that adhere to the passport strategy API should work fine, but there are some differences in other APIs made to integrate better with Fastify and to stick with Fastify's theme of performance.

Differences:

- `serializeUser` renamed to `registerUserSerializer` and always takes an async function with the signature `(user: User, request: FastifyRequest) => Promise<SerializedUser>`
- `deserializeUser` renamed to `registerUserDeserializer` and always takes an async function with the signature `(serialized: SerializedUser, request: FastifyRequest) => Promise<User>`
- `transformAuthInfo` renamed to `registerAuthInfoTransformer` and always takes an async function with the signature `(info: any, request: FastifyRequest) => Promise<any>`

## License

[MIT](./LICENSE)
