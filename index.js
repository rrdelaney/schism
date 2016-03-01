'use strict'

let route = require('./lib/route')

function deepMerge (A, B) {
  if (typeof A !== 'object') return Object.assign({}, B, { body: A || B.body })
  if (typeof B !== 'object') return Object.assign({}, A, { body: B || A.body })

  return Object.keys(B).reduce((prev, key) => {
    return typeof B[key] === 'object' && B[key] !== null
      ? Object.assign(prev, {
          [key]: Object.assign({}, prev[key], B[key])
        })
      : Object.assign({}, prev, { [key]: B[key] })
  }, Object.assign({}, A))
}

function mapToRes (res) {
  return props => {
    let isJSON = typeof props.body === 'object'
    let status = props.status || 200
    let headers = res.headers || { 'Content-Type': 'text/plain '}
    let body = isJSON ? JSON.stringify(props.body) : props.body || 'Not Found'

    if (isJSON) headers['Content-Type'] = 'application/json'

    res.writeHead(status, headers)
    res.end(body)
  }
}

function createState () {
  return {
    __state: {},

    listeners: {},

    get (name) {
      if (this.__state[name] !== undefined) return Promise.resolve(this.__state[name])

      return new Promise(resolve => {
        if (!this.listeners[name]) this.listeners[name] = []

        this.listeners[name].push(resolve)
      })
    },

    set (name, value) {
      this.__state[name] = value

      if (this.listeners[name]) {
        this.listeners[name].forEach(resolve => { resolve(value) })
        this.listeners[name] = undefined
      }
    }
  }
}

function schism (middleware, req, res) {
  if (!middleware) middleware = []

  const ctx = {
    state: createState(),

    get req () {
      return process.env.NODE_ENV !== 'test' ? req : undefined
    },

    get res () {
      return process.env.NODE_ENV !== 'test' ? res : undefined
    }
  }

  const addMiddleware = mware => middleware.push(mware)

  const hooks = { ctx, addMiddleware }

  const reduce = () => Promise.all(middleware.map(m => m(ctx))).then(_ => _.reduce(deepMerge, {}))

  const use = mware => schism(middleware.concat(mware))

  const bind = (_req, _res) =>
    schism(middleware, _req, _res)
      .reduce()
      .then(mapToRes(_res))

  const listen = port => require('http').createServer(bind).listen(port || 3000, '0.0.0.0')

  return { hooks, reduce, use, bind, listen }
}

let app = schism([
  require('./lib/bodyParser'),
  require('./lib/urlParser'),
  route.GET('/')(ctx => ctx.req.method),
  route.GET('/ping')(() => 'pong'),
  route.GET('/hello/:world')((ctx, params) => `Hello ${params.world}!`)
])

app.hooks.addMiddleware(route.GET('/ping')(() => 'ping'))

app.listen()
