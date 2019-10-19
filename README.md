# fastify-passport

![Build Status](https://github.com/fastify/fastify-passport/workflows/ci/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/fastify/fastify-passport/badge.svg?branch=master)](https://coveralls.io/github/fastify/fastify-passport?branch=master)
[![NPM version](https://img.shields.io/npm/v/fastify-passport.svg?style=flat)](https://www.npmjs.com/package/fastify-passport)

## Installation

```shell
npm install fastify-passport
```

## Example

```js
const server = fastify()
server.register(fastifyCookie)
server.register(fastifySession, {
  secret: 'ZUScxzpUKFpNoXXqLlfiPV8oTSl4zOpg',
  cookie: {secure: false}
})
server.register(fastifyPassport.initialize())
server.register(fastifyPassport.session())

server.get('/', {
  preValidation: fastifyPassport.authenticate('test', {authInfo: false})
}, async () => 'hello world!')
server.post('/login', {preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: false })}, () => {})

server.listen(0)
````

## API

### initialize()

### session()

### authenticate(name, options)

Authenticates requests.

Applies the `name`ed strategy (or strategies) to the incoming request, in
order to authenticate the request.  If authentication is successful, the user
will be logged in and populated at `request.user` and a session will be
established by default.  If authentication fails, an unauthorized response
will be sent.

Options:
  - `session`          Save login state in session, defaults to _true_
  - `successRedirect`  After successful login, redirect to given URL
  - `successMessage`   True to store success message in
                       req.session.messages, or a string to use as override
                       message for success.
  - `successFlash`     True to flash success messages or a string to use as a flash
                       message for success (overrides any from the strategy itself).
  - `failureRedirect`  After failed login, redirect to given URL
  - `failureMessage`   True to store failure message in
                       req.session.messages, or a string to use as override
                       message for failure.
  - `failureFlash`     True to flash failure messages or a string to use as a flash
                       message for failures (overrides any from the strategy itself).
  - `assignProperty`   Assign the object provided by the verify callback to given property

An optional `callback` can be supplied to allow the application to override
the default manner in which authentication attempts are handled.  The
callback has the following signature, where `user` will be set to the
authenticated user on a successful authentication attempt, or `false`
otherwise.  An optional `info` argument will be passed, containing additional
details provided by the strategy's verify callback - this could be information about
a successful authentication or a challenge message for a failed authentication.
An optional `status` argument will be passed when authentication fails - this could
be a HTTP response code for a remote authentication failure or similar.
```js
app.get('/protected', function(req, res, next) {
  passport.authenticate('local', function(err, user, info, status) {
    if (err) { return next(err) }
    if (!user) { return res.redirect('/signin') }
    res.redirect('/account');
  })(req, res, next);
});
```
Note that if a callback is supplied, it becomes the application's
responsibility to log-in the user, establish a session, and otherwise perform
the desired operations.

Examples:
 * `passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' });`
 * `passport.authenticate('basic', { session: false });`
 * `passport.authenticate('twitter');`

### authorize(name, options)

Middleware that will authorize a third-party account using the given
`strategy` name, with optional `options`.

If authorization is successful, the result provided by the strategy's verify
callback will be assigned to `request.account`.  The existing login session and
`request.user` will be unaffected.

This function is particularly useful when connecting third-party accounts
to the local account of a user that is currently authenticated.

Examples:

```js
passport.authorize('twitter-authz', { failureRedirect: '/account' });
```

### use([name], strategy)

Utilize the given `strategy` with optional `name`, overridding the strategy's
default name.

Examples:

```js
passport.use(new TwitterStrategy(...));

passport.use('api', new http.Strategy(...));
```

### unuse(name)

Un-utilize the `strategy` with given `name`.

In typical applications, the necessary authentication strategies are static,
configured once and always available.  As such, there is often no need to
invoke this function.

However, in certain situations, applications may need dynamically configure
and de-configure authentication strategies.  The `use()`/`unuse()`
combination satisfies these scenarios.

Example:

```js
passport.unuse('legacy-api');
```

### Request#isUnauthenticated()

Test if request is unauthenticated.

## License

[MIT](./LICENSE)