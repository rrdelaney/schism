import test from 'ava'
import http from 'http'
import delay from 'delay'
import request from 'supertest-as-promised'
import soular from './index'

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

test('::use should also apply middleware', async t => {
  const res = await soular([ _ => ({ x: true }) ])
    .use(_ => ({ y: true }))
    .reduce()

  t.same(res, { x: true, y: true })
})

test('app should default string to body', async t => {
  const res = await soular([
     _ => 'body!!!'
  ]).reduce()

  t.same(res, { body: 'body!!!'})
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
  const res = await soular([
    _ => 'A!!!',
    _ => 'B!!!'
  ]).reduce()

  t.same(res, { body: 'B!!!' })
})

test('app should wait for promises', async t => {
  const res = await soular([
    _ => delay(500).then(() => ({ x: true })),
    _ => ({ y: true })
  ]).reduce()

  t.same(res, { x: true, y: true })
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
