'use strict'

function deepMerge (A, B) {
  if (typeof B !== 'object') return Object.assign({}, A, { body: B || A.body })

  return Object.keys(B).reduce((prev, key) => {
    return typeof B[key] === 'object' && B[key] !== null
      ? Object.assign(prev, { [key]: Object.assign({}, prev[key], B[key]) })
      : Object.assign({}, prev, { [key]: B[key] })
  }, Object.assign({}, A))
}

function mapToRes (res) {
  return props => {
    let isJSON = typeof props.body === 'object'
    let headers = props.headers || { 'Content-Type': 'text/plain' }
    let body = isJSON ? JSON.stringify(props.body) : props.body || 'Not Found'
    let status = body === 'Not Found' ? 404 : props.status || 200

    if (isJSON) headers['Content-Type'] = 'application/json'

    res.writeHead(status, headers)
    res.end(body)
  }
}

const defaultErrHandler = err => ({ status: 500, body: 'Internal Server Error' })

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

module.exports = exports.default = function soular (middleware, err, req, res) {
  if (middleware === '☼' || middleware === '*') middleware = soular.defaults
  if (!middleware) middleware = []
  if (!err) err = defaultErrHandler

  const ctx = { req, res, state: createState() }

  const addMiddleware = mware => middleware.push(mware)

  const hooks = env => (process.env.NODE_ENV === 'production' ? false : env !== 'production')
    ? { ctx, addMiddleware }
    : (() => { throw new Error('Cannot access hooks in production!') })()

  const reduce = (init) => {
    try {
      return Promise.all(middleware.map(m => m(ctx)))
        .then(_ => _.reduce(deepMerge, init || {}))
        .catch(e => err(e, req, res))
    } catch (e) {
      return Promise.reject(e)
        .catch(e => err(e, req, res))
    }
  }

  const use = mware => soular(middleware.concat(mware), err)

  const _catch = handler => soular(middleware, handler)

  const bind = (_req, _res) =>
    soular(middleware, err, _req, _res)
      .reduce()
      .then(mapToRes(_res))

  const listen = port => require('http').createServer(bind).listen(port || 3000, '0.0.0.0')

  return { hooks, reduce, use, bind, listen, 'catch': _catch }
}

module.exports.defaults = [
  require('./lib/urlParser'),
  require('./lib/bodyParser')
]

const route = require('./lib/route')
module.exports.GET = route.GET
module.exports.POST = route.POST
