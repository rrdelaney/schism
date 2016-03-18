'use strict'

let soular = require('../soular')

const pingServer1 = soular('*')
  .use(soular.ping)
  .use(() => console.log('ping server 1!!!'))
  .plugin(soular.system)()
  .listen(3000)

soular.system.register(pingServer1, 'ping')

const pingServer2 = soular('*')
  .use(soular.ping)
  .use(() => console.log('ping server 2!!!'))
  .plugin(soular.system)()
  .listen(3001)

soular.system.register(pingServer2, 'ping')

const XServer = soular('*')
  .use(ctx =>
    ctx.system.get('ping')
      .then(ping => ping('/ping'))
      .then(res => ({ body: res.body }))
  )
  .plugin(soular.system)()
  .listen(3002)

soular.system.register(XServer, 'X')
