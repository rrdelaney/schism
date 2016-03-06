'use strict'

let httpProxy = require('http-proxy')

module.exports = function (target) {
  let options = typeof target === 'string' ? { target } : target
  let proxy = httpProxy.createProxyServer(options)

  return function (ctx) {
    return new Promise(resolve =>
      proxy.web(ctx.req, ctx.res, resolve)
    )
  }
}
