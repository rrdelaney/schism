'use strict'

function resolve (path, route) {
  let ROUTE_REGEX = '([\\w\\d%]+)'

  let varNames = path.match(/:(\w+)/g)
  if (varNames === null) {
    return path === route
  }

  let varVals = route.match(new RegExp(path.replace(/:(\w+)/g, ROUTE_REGEX)))

  let args = {}
  varNames
    .map(_ => _.slice(1))
    .forEach((name, idx) => args[name] = decodeURI(varVals.slice(1)[idx]))

  return args
}

function createRoute (method) {
  return path => fn => ctx => {
    return ctx.state.get('path')
      .then(reqPath => {
        if (ctx.req.method === method) {
          let allow = resolve(path, reqPath)

          if (allow !== false) {
            ctx.state.set('params', allow)

            return fn(ctx)
          }
        }
      })
  }
}

module.exports.GET = createRoute('GET')
module.exports.POST = createRoute('POST')
