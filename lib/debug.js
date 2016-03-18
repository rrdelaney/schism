'use strict'

module.exports = function debug () {
  this.hooks.ctx.debug = true

  return this
}
