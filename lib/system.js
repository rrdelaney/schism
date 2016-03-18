'use strict'

let got = require('got')

let config = module.exports.config = {
  registry: process.env.NODE_ENV === 'production' ? 'http://soular.system' : 'http://localhost:2379'
}

function createAPI (root) {
  return (endpoint, opts) =>
    opts
      ? got.post(root + endpoint, { body: JSON.stringify(opts) })
      : got(root + endpoint)
}

module.exports.system = function system () {
  this.hooks.ctx.system = this.hooks.createState()
  this.hooks.ctx.system.onGet = (name, state) => {
    got(`${config.registry}/v2/keys/services/${name}?recursive=true`)
      .then(res => JSON.parse(res.body))
      .then(res => res.node.nodes.map(n => n.value))
      .then(ips => ips[0]) // TODO: Change to random selection logic
      .then(res => { console.log(res); return res })
      .then(service => state.set(name, createAPI(service)))
  }

  return this
}

module.exports.register = function register (server, name) {
  let listening = new Promise(res => server.on('listening', res))

  let mkdir = got.put(`${config.registry}/v2/keys/services/${name}`, {
    body: { dir: 'true' }
  })

  return listening
    .then(mkdir)
    .catch(() => null)
    .then(() => server.address())
    .then(addr =>
      got.post(`${config.registry}/v2/keys/services/${name}`, {
        body: {
          value: addr.port ? addr.address + ':' + addr.port.toString() : addr.address
        }
      })
    )
}
