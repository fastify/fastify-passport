import { test, describe } from 'node:test';
import assert from 'node:assert';
import got from 'got';
import { AddressInfo } from 'node:net';
import { AuthenticateOptions } from '../src/AuthenticationRoute';
import Authenticator from '../src/Authenticator';
import { Strategy } from '../src/strategies';
import { getConfiguredTestServer, getRegisteredTestServer, getTestServer, TestStrategy } from './helpers';

const testSuite = (sessionPluginName: string) => {
  describe(`${sessionPluginName} tests`, () => {
    test('should return 401 Unauthorized if not logged in', async () => {
      const { server, fastifyPassport } = getConfiguredTestServer();

      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
        async () => 'hello world!'
      );
      server.post('/login', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, () => {});

      const response = await server.inject({ method: 'GET', url: '/' });
      assert.strictEqual(response.body, 'Unauthorized');
      assert.strictEqual(response.statusCode, 401);
    });

    test('should allow login, and add successMessage to session upon logged in', async () => {
      const { server, fastifyPassport } = getConfiguredTestServer('test', new TestStrategy('test'), null, {
        clearSessionIgnoreFields: ['messages']
      });

      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
        async (request, reply) => {
          reply.send(request.session.get('messages'));
        }
      );
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            successRedirect: '/',
            successMessage: 'welcome',
            authInfo: false
          })
        },
        () => {}
      );

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/login',
        payload: { login: 'test', password: 'test' }
      });

      assert.strictEqual(loginResponse.statusCode, 302);
      assert.strictEqual(loginResponse.headers.location, '/');

      const homeResponse = await server.inject({
        url: '/',
        headers: {
          cookie: loginResponse.headers['set-cookie']
        },
        method: 'GET'
      });

      assert.strictEqual(homeResponse.body, '["welcome"]');
      assert.strictEqual(homeResponse.statusCode, 200);
    });

    test('should allow login, and add successMessage to the session from a strategy that sets it', async () => {
      class WelcomeStrategy extends Strategy {
        authenticate (request: any, _options?: { pauseStream?: boolean }) {
          if (request.isAuthenticated()) {
            return this.pass();
          }
          if (request.body && request.body.login === 'welcomeuser' && request.body.password === 'test') {
            return this.success({ name: 'test' }, { message: 'welcome from strategy' });
          }
          this.fail();
        }
      }

      const { server, fastifyPassport } = getConfiguredTestServer('test', new WelcomeStrategy('test'), null, {
        clearSessionIgnoreFields: ['messages']
      });
      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate('test', { authInfo: false })
        },
        async (request) => request.session.get('messages')
      );
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            successRedirect: '/',
            successMessage: true,
            authInfo: false
          })
        },
        () => {}
      );

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'welcomeuser', password: 'test' },
        url: '/login'
      });
      assert.strictEqual(login.statusCode, 302);
      assert.strictEqual(login.headers.location, '/');

      const response = await server.inject({
        url: '/',
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      });

      assert.strictEqual(response.body, '["welcome from strategy"]');
      assert.strictEqual(response.statusCode, 200);
    });

    test('should throw error if pauseStream is being used', async () => {
      const fastifyPassport = new Authenticator({ clearSessionIgnoreFields: ['messages'] });
      fastifyPassport.use('test', new TestStrategy('test'));
      fastifyPassport.registerUserSerializer(async (user) => JSON.stringify(user));
      fastifyPassport.registerUserDeserializer(async (serialized: string) => JSON.parse(serialized));

      const server = getTestServer();
      server.register(fastifyPassport.initialize());
      server.register(
        fastifyPassport.secureSession({
          pauseStream: true
        } as AuthenticateOptions)
      );
      server.get('/', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, async (request) =>
        request.session.get('messages')
      );
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            successRedirect: '/',
            successMessage: 'welcome',
            authInfo: false
          })
        },
        () => {}
      );

      let response = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login'
      });
      assert.strictEqual(response.statusCode, 500);

      response = await server.inject({
        url: '/',
        method: 'GET'
      });

      assert.strictEqual(response.statusCode, 500);
    });

    test('should execute successFlash if logged in', async () => {
      const { server, fastifyPassport } = getConfiguredTestServer('test', new TestStrategy('test'), null, {
        clearSessionIgnoreFields: ['flash']
      });
      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
        async (request, reply) => reply.flash('success')
      );
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            successRedirect: '/',
            successFlash: 'welcome',
            authInfo: false
          })
        },
        () => {}
      );

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login'
      });
      assert.strictEqual(login.statusCode, 302);
      assert.strictEqual(login.headers.location, '/');

      const response = await server.inject({
        url: '/',
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      });

      assert.strictEqual(response.body, '["welcome"]');
      assert.strictEqual(response.statusCode, 200);
    });

    test('should execute successFlash=true if logged in', async () => {
      const { server, fastifyPassport } = getConfiguredTestServer();
      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
        async (request, reply) => reply.flash('success')
      );
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            successRedirect: '/',
            successFlash: true,
            authInfo: false
          })
        },
        () => {}
      );

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login'
      });
      assert.strictEqual(login.statusCode, 302);
      assert.strictEqual(login.headers.location, '/');

      const response = await server.inject({
        url: '/',
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      });

      assert.strictEqual(response.body, '[]');
      assert.strictEqual(response.statusCode, 200);
    });

    test('should return 200 if logged in and redirect to the successRedirect from options', async () => {
      const { server, fastifyPassport } = getConfiguredTestServer();
      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
        async () => 'hello world!'
      );
      server.post(
        '/login',
        { preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: false }) },
        () => {}
      );

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login'
      });
      assert.strictEqual(login.statusCode, 302);
      assert.strictEqual(login.headers.location, '/');

      const response = await server.inject({
        url: String(login.headers.location),
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      });

      assert.strictEqual(response.body, 'hello world!');
      assert.strictEqual(response.statusCode, 200);
    });

    test('should return use assignProperty option', async () => {
      const { server, fastifyPassport } = getConfiguredTestServer();
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            successRedirect: '/',
            assignProperty: 'user',
            authInfo: false
          })
        },
        (request: any, reply: any) => {
          reply.send(request.user);
        }
      );

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login'
      });
      assert.strictEqual(JSON.parse(login.body).name, 'test');
    });

    test('should redirect to the returnTo set in the session upon login', async () => {
      const { server, fastifyPassport } = getConfiguredTestServer('test', new TestStrategy('test'), null, {
        clearSessionIgnoreFields: ['returnTo']
      });
      server.addHook('preValidation', async (request, _reply) => {
        request.session.set('returnTo', '/success');
      });
      server.get(
        '/success',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
        async () => 'hello world!'
      );
      server.post(
        '/login',
        { preValidation: fastifyPassport.authenticate('test', { successReturnToOrRedirect: '/', authInfo: false }) },
        () => {}
      );

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login'
      });
      assert.strictEqual(login.statusCode, 302);
      assert.strictEqual(login.headers.location, '/success');

      const response = await server.inject({
        url: String(login.headers.location),
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      });

      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.body, 'hello world!');
    });

    test('should return 200 if logged in and authInfo is true', async () => {
      const { server, fastifyPassport } = getConfiguredTestServer();
      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: true }) },
        async () => 'hello world!'
      );
      server.post(
        '/login',
        { preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: true }) },
        () => {}
      );

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login'
      });
      assert.strictEqual(login.statusCode, 302);
      assert.strictEqual(login.headers.location, '/');

      const response = await server.inject({
        url: '/',
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      });

      assert.strictEqual(response.body, 'hello world!');
      assert.strictEqual(response.statusCode, 200);
    });

    test('should return 200 if logged in against a running server', async () => {
      const { server, fastifyPassport } = getConfiguredTestServer();
      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: true }) },
        async () => 'hello world!'
      );
      server.post(
        '/login',
        { preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: true }) },
        () => {}
      );

      await server.listen();
      server.server.unref();

      const port = (server.server.address() as AddressInfo).port;
      const login = await got('http://localhost:' + port + '/login', {
        method: 'POST',
        json: { login: 'test', password: 'test' },
        followRedirect: false
      });
      assert.strictEqual(login.statusCode, 302);
      assert.strictEqual(login.headers.location, '/');
      const cookies = login.headers['set-cookie']!;
      assert.strictEqual(cookies.length, 1);

      const home = await got({
        url: 'http://localhost:' + port,
        headers: {
          cookie: cookies[0]
        },
        method: 'GET'
      });

      assert.strictEqual(home.statusCode, 200);
    });

    test('should execute failureRedirect if failed to log in', async () => {
      const { server, fastifyPassport } = getConfiguredTestServer();
      server.post(
        '/login',
        { preValidation: fastifyPassport.authenticate('test', { failureRedirect: '/failure', authInfo: false }) },
        () => {}
      );

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test1', password: 'test' },
        url: '/login'
      });
      assert.strictEqual(login.statusCode, 302);
      assert.strictEqual(login.headers.location, '/failure');
    });

    test('should add failureMessage to session if failed to log in', async () => {
      const { server, fastifyPassport } = getConfiguredTestServer();
      server.get('/', async (request, reply) => reply.send(request.session.get('messages')));
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            failureMessage: 'try again',
            authInfo: false
          })
        },
        async () => 'login page'
      );

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'not-correct', password: 'test' },
        url: '/login'
      });
      assert.strictEqual(login.statusCode, 401);

      const headers = {};
      if (login.headers['set-cookie']) {
        headers['cookie'] = login.headers['set-cookie'];
      }
      const home = await server.inject({
        url: '/',
        headers,
        method: 'GET'
      });

      assert.strictEqual(home.body, '["try again"]');
      assert.strictEqual(home.statusCode, 200);
    });

    test('should add failureFlash to session if failed to log in', async () => {
      const { server, fastifyPassport } = getConfiguredTestServer();

      server.get('/', async (request, reply) => reply.flash('error'));
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            failureFlash: 'try again',
            authInfo: false
          })
        },
        () => {}
      );

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'not-correct', password: 'test' },
        url: '/login'
      });
      assert.strictEqual(login.statusCode, 401);

      const response = await server.inject({
        url: '/',
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      });

      assert.strictEqual(response.body, '["try again"]');
      assert.strictEqual(response.statusCode, 200);
    });

    test('should add failureFlash=true to session if failed to log in', async () => {
      const { server, fastifyPassport } = getConfiguredTestServer();
      server.get('/', async (request, reply) => reply.flash('error'));
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            failureFlash: true,
            authInfo: false
          })
        },
        () => {}
      );

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'not-correct', password: 'test' },
        url: '/login'
      });
      assert.strictEqual(login.statusCode, 401);

      const response = await server.inject({
        url: '/',
        method: 'GET'
      });

      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.body, '[]');
    });

    test('should return 401 Unauthorized if not logged in when used as a handler', async () => {
      const { server, fastifyPassport } = getConfiguredTestServer();

      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
        async () => 'hello world!'
      );
      server.post('/login', fastifyPassport.authenticate('test', { authInfo: false, successRedirect: '/' }));

      const response = await server.inject({ method: 'GET', url: '/' });
      assert.strictEqual(response.body, 'Unauthorized');
      assert.strictEqual(response.statusCode, 401);
    });

    test('should redirect when used as a handler', async () => {
      const { server, fastifyPassport } = getConfiguredTestServer();
      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: true }) },
        async () => 'hello world!'
      );
      server.post('/login', fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: true }));

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login'
      });
      assert.strictEqual(login.statusCode, 302);
      assert.strictEqual(login.headers.location, '/');

      const response = await server.inject({
        url: '/',
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      });

      assert.strictEqual(response.body, 'hello world!');
      assert.strictEqual(response.statusCode, 200);
    });

    test('should not log the user in when passed a callback', async () => {
      const { server, fastifyPassport } = getConfiguredTestServer();
      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: true }) },
        async () => 'hello world!'
      );
      server.post(
        '/login',
        fastifyPassport.authenticate('test', async (request, reply, err, user) => {
          return (user as any).name;
        })
      );

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login'
      });
      assert.strictEqual(login.statusCode, 200);
      assert.strictEqual(login.body, 'test');

      const headers: Record<string, any> = {};
      if (login.headers['set-cookie']) {
        headers['cookie'] = login.headers['set-cookie'];
      }

      const response = await server.inject({
        url: '/',
        headers,
        method: 'GET'
      });

      assert.strictEqual(response.statusCode, 401);
    });

    test('should allow registering strategies after creating routes referring to those strategies by name', async () => {
      const { server, fastifyPassport } = getRegisteredTestServer(null, { clearSessionIgnoreFields: ['messages'] });

      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
        async (request, reply) => {
          reply.send(request.session.get('messages'));
        }
      );

      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            successRedirect: '/',
            successMessage: 'welcome',
            authInfo: false
          })
        },
        () => {}
      );

      // register the test strategy late (after the above .authenticate calls)
      fastifyPassport.use(new TestStrategy('test'));

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/login',
        payload: { login: 'test', password: 'test' }
      });

      assert.strictEqual(loginResponse.statusCode, 302);
      assert.strictEqual(loginResponse.headers.location, '/');

      const homeResponse = await server.inject({
        url: '/',
        headers: {
          cookie: loginResponse.headers['set-cookie']
        },
        method: 'GET'
      });

      assert.strictEqual(homeResponse.body, '["welcome"]');
      assert.strictEqual(homeResponse.statusCode, 200);
    });
  });
};

testSuite('@fastify/session');
testSuite('@fastify/secure-session');
