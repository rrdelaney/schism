'use strict'

let got = require('got')
let FormData = require('form-data')

let config = module.exports.config = {
  registry: process.env.NODE_ENV === 'production' ? 'http://soular.system' : 'http://localhost:2379'
}

module.exports.system = function system () {
  this.hooks.ctx.system = this.hooks.createState()
  this.hooks.ctx.system.onGet = (name, state) => {
    got(`${config.registry}/v2/keys/services/${name}?recursive=true`)
      .then(JSON.parse)
      .then(res => res.node.nodes.map(n => n.value))
      .then(ips => ips[0]) // TODO: Change to random selection logic
      .then(service => state.set(name, service))
  }

  return this
}

module.exports.register = function register (server, name) {
  let listening = new Promise(res => server.on('listening', res))

  let mkdirForm = new FormData()
  mkdirForm.append('dir', 'true')

  let mkdir = got.put(`${config.registry}/v2/keys/services/${name}`, {
    headers: mkdirForm.getHeaders(),
    body: mkdirForm
  })

  return Promise.all([listening, mkdir])
    .then(() => {
      let addServiceForm = new FormData()
      let address = server.address()

      addServiceForm.append('value', address.port ? address.address + ':' + address.port.toString() : address.address)

      return got.post(`${config.registry}/v2/keys/services/${name}`, {
        headers: addServiceForm.getHeaders(),
        body: addServiceForm
      })
    })
}
