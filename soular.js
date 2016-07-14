'use strict'

function deepMerge (A, B) {
  if (typeof B !== 'object') return Object.assign({}, A, { body: B || A.body })
  if (A.$force) return A
  if (B.$force) return B

  return Object.keys(B).reduce((prev, key) => {
    return typeof B[key] === 'object' && B[key] !== null
      ? Object.assign(prev, { [key]: Object.assign({}, prev[key], B[key]) })
      : Object.assign({}, prev, { [key]: B[key] })
  }, Object.assign({}, A))
}

function mapToRes (res) {
  return props => {
    let isJSON = typeof props.body === 'object'
    let headers = props.headers || { 'Content-Type': 'text/html' }
    let body = isJSON ? JSON.stringify(props.body) : props.body || 'Not Found'
    let status = body === 'Not Found' ? 404 : props.status || 200

    if (isJSON) headers['Content-Type'] = 'application/json'

    res.writeHead(status, headers)
    res.end(body)
  }
}

const defaultErrHandler = () => ({ status: 500, body: 'Internal Server Error' })

function createState (init = {}) {
  init.__listeners = []

  return new Proxy(init, {
    get: (state, name) => {
      if (state[name] !== undefined) return Promise.resolve(state[name])

      return new Promise(resolve => {
        if (!state.__listeners[name]) state.__listeners[name] = []

        state.__listeners[name].push(resolve)
      })
    },

    set: (state, name, value) => {
      state[name] = value

      if (state.__listeners[name]) {
        state.__listeners[name].forEach(resolve => { resolve(value) })
        state.__listeners[name] = undefined
      }

      return true
    }
  })
}

module.exports = exports.default = function soular (middleware, initialState, err) {
  if (middleware === '☼' || middleware === '*') middleware = soular.defaults
  if (!middleware) middleware = []
  if (!err) err = defaultErrHandler

  const ctx = { debug: false, state: createState(initialState) }

  const addMiddleware = mware => middleware.push(mware)

  const hooks = { createState, addMiddleware, ctx }

  const reduce = init => {
    let local = Object.assign({}, ctx, init)
    let result

    try {
      result = Promise.all(middleware.map(m => m(local)))
        .then(_ => _.reduce(deepMerge, {}))
    } catch (e) {
      result = Promise.reject(e)
    }

    return result.catch(e => { console.error(e.stack); return err(e, local) })
  }

  const use = mware => soular(middleware.concat(mware), initialState, err)

  const plugin = p => p.bind({ hooks, reduce, use, plugin, bind, listen, 'catch': _catch })

  const _catch = handler => soular(middleware, initialState, handler)

  const bind = (req, res) => reduce({ req, res }).then(mapToRes(res))

  const listen = port => require('http').createServer(bind).listen(port || 3000, '0.0.0.0')

  return { hooks, reduce, use, plugin, bind, listen, 'catch': _catch }
}

module.exports.defaults = [require('./urlParser'), require('./bodyParser')]
