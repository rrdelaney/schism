'use strict'

let soular = require('../soular')
let ping = require('../ping')
let s = require('../system')

const pingServer1 = soular('*')
  .use(ping)
  .use(() => console.log('ping server 1!!!'))
  .plugin(s.system)()
  .listen(3000)

s.register(pingServer1, 'ping')

const pingServer2 = soular('*')
  .use(ping)
  .use(() => console.log('ping server 2!!!'))
  .plugin(s.system)()
  .listen(3001)

s.register(pingServer2, 'ping')

const XServer = soular('*')
  .use(ctx =>
    ctx.system.get('ping')
      .then(ping => ping('/ping'))
      .then(res => ({ body: res.body }))
  )
  .plugin(s.system)()
  .listen(3002)

s.register(XServer, 'X')
