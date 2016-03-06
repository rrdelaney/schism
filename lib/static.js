'use strict'

let sendFile = require('./sendFile')

module.exports = function (path, dir) {
  return function (ctx) {
    if (ctx.path.startsWith(path)) {
      return sendFile(ctx.req.path.replace(path, dir))
    }
  }
}
