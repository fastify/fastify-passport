# Fastify-Passport Programmatic API Design

This document outlines my thought process through important decisions that were made while
implementing the `authenticateRequest` function that provides a programmatic auth API for
`@fastify/passport`

## 1. Implementation Architecture

**Promise-based Flow**
Passport code is callback-based but we want it to be Promise-based. Passport strategies work by executing and then calling one of five callbacks (`success`, `fail`, `error`, `redirect`, `pass`) when the execution is done. To change this to be a promise based flow we make a clone of the strategy and patch the callback methods to resolve or reject a promise. So `strategy.authenticate(request, options)` will run the same exact strategy code as before but return a promise instead of using callbacks.

**How we clone matters**
At first I considered the classic cloning method of using `Object.assign` to clone the strategy but after some research I realized this would break the prototype chain. This would cause issues where the strategy would lose it's parent class methods. This would break the strategy's ability to call `this.success()`, `this.fail()`, etc. I found that `Object.create(strategy)` would create a new object that kept the prototype chain intact.

**Stateless Method vs. Stateful Class**
I considered following the originals codes design of the `Authenticator` class calling another class to handle the execution logic. After looking deeper into how the original code worked, I realized that `AuthenticatorRoute` is a factory that needed to be stateful to to hold the data for the route hook function. Our new method is just a function that executes statelessly. It seemed overkill to create a new class even if thats what the original code did. So I decided to just keep the code in `Authenticator.ts`

**Duplication of logic over helper functions**
I noticed the `getStrategyName` and `getStrategy` in the `AuthenticatorRoute` was code that could be used for our new logic too. I considered moving it to a shared utility file to avoid duplicating code, but realized that since `AuthenticatorRoute` was a separate class, it had to call the public `this.authenticator.strategy()` method to get the strategy. And since our code was already in `Authenticator.ts`, we had access to the `this.strategies` variable directly. A helper would have to pass around `this.strategies` or the `Authenticator` class to the helper function which felt messy and some duplicate code was better than a confusing abstraction. That's how we ended up with `resolveStrategyName` and `resolveStrategy` in `Authenticator.ts`.

## 2. API Design Decisions

**Naming Conventions in Types.ts**
The most common question I had when making the types was how does the current Passport code and `Authenticator` class handle the types. If we needed data and it already was called something else in the Passport code (like challenge, status, or info), we just used that name. If we needed data and it didn't exist in the Passport code, we tried to keep to same naming convention of other types

**AuthResult**
The assignment gives a pretty comprehensive example of what `AuthResult` should look like. Here's my reaosoning for some of my departures from the example:
**Strategy is optional**
I didn't want to return a strategy if all strategies failed. So I made it optional, the developer would have to check if `ok` is true before using the strategy. But I think this is better than returning a strategy that could've failed.

**Staus code NOT optional**
It's a little redundant to return a 200 when `ok` it true but I think the consistency of always having a status code is worth the redundancy. I realize this seems to contradict my `Strategy is optional` decision but I think the difference is that status code always does exist, it's just a decision to give it to the developer or not. Whereas `strategy` can be misleading if returned when all strategies failed.

**RedirectUrl**
Passport right now automatically set a header when the `redirect` callback fires. We want to keep that behavior possible but hand the final decision to the developer on what to ultimately do. So instead of setting the header we return a `redirectUrl` property. The developer can then use that data to redirect the user or whatever else they want to do.

**Info unknown**
I wasn't sure what `info` was at first and wondered if it could be typed. But `info` is defined by the strategy and there's no standard so we truly don't know what it is.

**AuthContext**
Again the assignment gives a good example of what `AuthContext` should look like and I'll share the decisions I made to change it and why.

**Change attempts to an object**
AuthContext is an object to store the overall outcome of the authentication attempt. I used the attempts field on it to store data on each individual strategy attempt. We stored the strategy name, outcome, elapsed time and error type. One concern I have is if its harder for metrics to read the length of an array compared to just a number. I decided that modern metrics tools are able to determine a length of an array so I decided it was fine to replace the attempts amounts number.

**successfulStrategy**
Same as `strategy` in `AuthResult` I thought optional would be good to only appear on success for the same reasons. I renamed it to `successfulStrategy` though to be more clear since the `AuthAttempt` type also has a `strategy` field. And the top level `successfulStrategy` field is for the whole authentication attempt.

**API Design**
Most of the design decisions were based on giving the developer to power to control the flow of the authentication process. Here's some of the more niche decisions I made.
**`authenticateRequest()` does NOT auto-login (but it can)**
The assignment says `implicit side effects only`. Passport has a `AuthenticateOptions` with a `session` option that defaults to `true` and auto logs the user in on a successful authenticate so we want to turn that off. But a developer might want an easy way to auto login, Passports `AuthenticateOptions` has a `session` option. So instead of calling `authContext.login(user)` after a successful authentication, the developer can just pass `session: true` to `authenticateRequest` and it will auto login the user.

**`error()` halts the loop**
I considered allowing `error()` try the next strategy. I thought it might be good to try another strategy if one strategy was temporarily down or something. But I noticed that the original code stop's the execution on any error. This made me think of the unexpected behaviours that could emerge if we continued the loop on an error. Like an example is if we used our database to blacklist a user and the database was down, if we skipped over the error and tried another the malicious user could still login. So ultimately I decided to just do what Passport was doing.

## 3. Security & Observability

**Sanitized Errors**
The errors returned from strategies can be anything the strategies want to throw. So we can't really trust the payload. A database could error with raw SQL or an OAUTH provider could throw a token. To hopefully give the developer some context without risking leaking important infrastructure secrets or PII I decided to return the `error.name` of the error thrown. It should give some context like `TokenExpiredError` or `InvalidTokenError` but not the full error message. We could maybe use regex to redact PII from the error message but I think it's not worth it for being computaionally expensive and having too much risking of letting PII slip through the filters.

**User ID PII Tradeoff**
With our implementation `userId` could have PII in it. If the application developer uses something like an `email` as the user id then we're logging that email here. I considered not logging it but I think at some point we have to offload the responsibility to the application developer to not use PII as the user id. Maybe this is a mistake but I think the `userId` is too valuable of context to not log it for some applications. Hopefully no one is using SSN's as userIds!

## 4. Bonus, Edge Cases, Known Limitations
**Hanging Promise**
I didn't get to this but I'll explain the timeout problem and how we would solve it. Just like Passport itself, we are using strategies that aren't designed and written by us. If a strategy is poorly written and never calls any of the functions that resolve the promise then we will hang indefinitely. We would handle this is add a timeout that rejects the promise if it takes too long. This should work the same way as if the strategy called `error()` since it opens us to the same security risks if we contiue