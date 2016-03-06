import test from 'ava'
import http from 'http'
import delay from 'delay'
import { dirname } from 'path'
import request from 'supertest-as-promised'
import tempWrite from 'temp-write'
import soular, { GET, POST, defaults } from './soular'
import cors from './lib/cors'
import ping from './lib/ping'
import sendFile from './lib/sendFile'
import statik from './lib/static'
import proxy from './lib/proxy'

test('app should reduce', async t => {
  const res = await soular([
    _ => ({ x: true }),
    _ => ({ y: true })
  ]).reduce()

  t.same(res, { x: true, y: true })
})

test('empty app should reduce to empty object', async t => {
  const res = await soular().reduce()

  t.same(res, {})
})

test('::use should apply middleware', async t => {
  const res = await soular([ _ => ({ x: true }) ])
    .use(_ => ({ y: true }))
    .reduce()

  t.same(res, { x: true, y: true })
})

test('::use should apply an array middleware', async t => {
  const res = await soular()
    .use([
      _ => ({ y: true }),
      _ => ({ x: true })
    ])
    .reduce()

  t.same(res, { x: true, y: true })
})

test('app should default string to body', async t => {
  const { body } = await soular([
     _ => 'body!!!'
  ]).reduce()

  t.same(body, 'body!!!')
})

test('middleware should override in order', async t => {
  const res = await soular([
    _ => ({ x: true }),
    _ => ({ y: true }),
    _ => ({ x: false })
  ]).reduce()

  t.same(res, { x: false, y: true })
})

test('body should be replaced in order', async t => {
  const { body } = await soular([
    _ => 'A!!!',
    _ => 'B!!!'
  ]).reduce()

  t.is(body, 'B!!!')
})

test('app should wait for promises', async t => {
  const res = await soular([
    _ => delay(500).then(() => ({ x: true })),
    _ => ({ y: true })
  ]).reduce()

  t.same(res, { x: true, y: true })
})

test('middleware can be async functions', async t => {
  const setBody = async () => {
    let x = await delay(500)

    return 'body!!!'
  }

  const { body } = await soular([setBody])
    .reduce()

  t.is(body, 'body!!!')
})

test('ctx.state should sync things', async t => {
  const setState = ({ state }) => {
    state.set('x', true)
  }

  const getState = async ({ state }) => {
    const x = await state.get('x')
    return { x }
  }

  const { x } = await soular([setState, getState])
    .reduce()

  t.is(x, true)
})

test('ctx.state should allow multiple listeners', async t => {
  const setState = ({ state }) => {
    state.set('x', true)
  }

  const getState1 = async ({ state }) => {
    const x = await state.get('x')
    return { x }
  }

  const getState2 = async ({ state }) => {
    const x = await state.get('x')
    return { y: x }
  }

  const { x, y } = await soular([setState, getState1, getState2])
    .reduce()

  t.is(x, true)
  t.is(y, true)
})

test('ctx.state should have a default option', async t => {
  const getState = async ({ state }) => {
    const x = await state.get('x')
    return { x }
  }

  const { x } = await soular([getState], { x: true })
    .reduce()

  t.is(x, true)
})

test('::bind should provide a handler for an http server', t => {
  const app = soular([ctx => ctx.req.url])

  const server = http.createServer(app.bind)

  return request(server)
    .get('/xyz')
    .expect(200)
    .expect('/xyz')
})

test('::listen should provide an http server', t => {
  const app = soular([ctx => ctx.req.url])

  return request(app.listen())
    .get('/xyz')
    .expect(200)
    .expect('/xyz')
})

test('bodyParser should parse a plaintext body', t => {
  const app = soular(defaults)
    .use(async ({ state }) => await state.get('body'))

  return request(app.bind)
    .post('/')
    .send('this is plaintext')
    .expect(200)
    .expect('this is plaintext')
})

test('bodyParser should parse a JSON body', t => {
  const app = soular(defaults)
    .use(async ({ state }) => ({ body: await state.get('body') }))

  return request(app.bind)
    .post('/')
    .send({ x: true, y: true })
    .expect(200)
    .expect({ x: true, y: true })
})

test('urlParser should parse get params', t => {
  const app = soular(soular.defaults)
    .use(async ({ state }) => ({ body: await state.get('query') }))

  return request(app.bind)
    .get('/?x=x&y=y')
    .expect(200)
    .expect({ x: 'x', y: 'y' })
})

test('urlParser should parse path', t => {
  const app = soular(defaults)
    .use(async ({ state }) => ({ body: await state.get('path') }))

  return request(app.bind)
    .get('/x/y/z?x=x&y=y')
    .expect(200)
    .expect('/x/y/z')
})

test('no body should 404', t => {
  const app = soular()

  return request(app.bind)
    .get('/')
    .expect(404)
    .expect('Not Found')
})

test('hooks should not accessable in production', t => {
  const app = soular()

  t.throws(() => app.hooks('production'))
})

test('hooks.addMiddleware should add middleware mutably', t => {
  const app = soular()

  app.hooks().addMiddleware(_ => 'body!!!')

  return request(app.bind)
    .get('/')
    .expect('body!!!')
})

test('router should allow on correct GET route', t => {
  const app = soular(defaults)
    .use(GET('/path')(_ => 'body!!!'))

  return request(app.bind)
    .get('/path')
    .expect(200)
    .expect('body!!!')
})

test('router should allow on correct POST route', t => {
  const app = soular(defaults)
    .use(POST('/path')(_ => 'body!!!'))

  return request(app.bind)
    .post('/path')
    .expect(200)
    .expect('body!!!')
})

test('router should 404 on unmatched route', t => {
  const app = soular(defaults)
    .use(GET('/path')(_ => 'body!!!'))

  return request(app.bind)
    .get('/nope')
    .expect(404)
})

test('router should 404 on unmatched method', t => {
  const app = soular(defaults)
    .use(GET('/path')(_ => 'body!!!'))

  return request(app.bind)
    .post('/path')
    .expect(404)
})

test('router should parse route variables', t => {
  const app = soular(defaults)
    .use(GET('/path/:id')(async ({ state }) => {
      let { id } = await state.get('params')

      return id
    }))

  return request(app.bind)
    .get('/path/100')
    .expect(200)
    .expect('100')
})

test('ping should return pong', t => {
  const app = soular(defaults)
    .use(ping)

  return request(app.bind)
    .get('/ping')
    .expect(200)
    .expect('pong')
})

test('cors should set header', t => {
  const app = soular(defaults)
    .use([ping, cors])

  return request(app.bind)
    .get('/ping')
    .expect(200)
    .expect('pong')
    .expect('Access-Control-Allow-Origin', '*')
})

test('* should be defaults', t => {
  const app = soular('*')
    .use(async ({ state }) => await state.get('body'))

  return request(app.bind)
    .post('/')
    .send('this is plaintext')
    .expect(200)
    .expect('this is plaintext')
})

test('☼ should be defaults', t => {
  const app = soular('☼')
    .use(async ({ state }) => await state.get('body'))

  return request(app.bind)
    .post('/')
    .send('this is plaintext')
    .expect(200)
    .expect('this is plaintext')
})

test('sendFile should send a file', t => {
  const fpath = tempWrite.sync('test!!!', 'test.txt')

  const app = soular([_ => sendFile(fpath)])

  return request(app.bind)
    .get('/')
    .expect(200)
    .expect('Content-Type', 'text/plain')
    .expect('test!!!')
})

test('static should serve a directory', t => {
  const fpath = tempWrite.sync('test!!!', 'test/test.txt')
  const dir = dirname(fpath)

  const app = soular([statik('/static', dir)])

  return request(app.bind)
    .get('/static/test.txt')
    .expect(200)
    .expect('Content-Type', 'text/plain')
    .expect('test!!!')
})

test('proxy should forward requests', t => {
  const proxiedApp = soular('*')
    .use(_ => 'test!!!')
    .listen(12345)

  const app = soular([proxy('http://localhost:12345')], { 'proxy?': true })

  return request(app.bind)
    .get('/')
    .expect(200)
    .expect('test!!!')
})

test('proxy should only not handled requests', t => {
  const proxiedApp = soular('*').use(ping).listen(12346)

  const app = soular('*')
    .use(GET('/ping')(proxy('http://localhost:12346')))
    .use(GET('/test')(_ => 'test!!!'))

  const server = app.listen(12347)

  const req1 = request(server)
    .get('/test')
    .expect(200)
    .expect('test!!!')

  const req2 = request(server)
    .get('/ping')
    .expect(200)
    .expect('pong')

  return Promise.all([req1, req2])
})
