'use strict'

let url = require('url')

module.exports = function urlParser (ctx) {
  let parsed = url.parse(ctx.req.url)

  let params = parsed.query === null
    ? {}
    : parsed.query
        .split('&')
        .map(_ => _.split('='))
        .reduce((prev, curr) => {
          prev[decodeURI(curr[0])] = decodeURI(curr[1])
          return prev
        }, {})

  ctx.state.path = parsed.pathname
  ctx.state.query = params
}
