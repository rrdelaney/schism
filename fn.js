const route = require('./route')

module.exports = (method, path) => handler =>
  route[method](path)(e => e.state.body.then(handler).then(body => ({ body })))
