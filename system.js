'use strict'

let fetch = require('fech')

let config = module.exports.config = {
  registry: process.env.NODE_ENV === 'production' ? 'http://soular.system' : 'http://localhost:2379'
}

function createAPI (root) {
  return (endpoint, opts) =>
    opts
      ? fetch(root + endpoint, { method: 'post', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(opts) })
      : fetch(root + endpoint)
}

const lookup = module.exports.lookup = name =>
  fetch(`${config.registry}/v2/keys/services/${name}?recursive=true`)
    .then(_ => _.json())
    .then(_ => _.node.nodes.map(n => n.value))
    .then(ip => ip[0]) // TODO: Use RR or something

module.exports.system = function system () {
  this.hooks.ctx.system = this.hooks.createState()
  this.hooks.ctx.system.onGet = (name, state) =>
    lookup(name).then(service => state.set(name, createAPI(service)))

  return this
}

module.exports.register = function register (server, name) {
  let listening = new Promise(res => server.on('listening', res))

  let mkdir = fetch(`${config.registry}/v2/keys/services/${name}`, {
    method: 'put',
    body: 'dir=true',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })

  return listening
    .then(mkdir)
    .catch(() => null)
    .then(() => server.address())
    .then(addr =>
      fetch(`${config.registry}/v2/keys/services/${name}`, {
        method: 'post',
        body: `value=${addr.port ? addr.address + ':' + addr.port.toString() : addr.address}`
      })
    )
}
