'use strict'

let sendFile = require('./sendFile')

module.exports = function (path, dir) {
  return function (ctx) {
    if (ctx.req.url.startsWith(path)) {
      return sendFile(ctx.req.url.replace(path, dir))
    }
  }
}
