'use strict'

let schism = require('./index')
let route = require('./lib/route')

let app1 = schism([_ => ({ body: { version: 1 } } )])


  // .use(route.GET('/')(ctx => ctx.req.method))
  // .use(route.GET('/ping')(() => 'pong'))
  // .use(route.GET('/hello/:world')(ctx => `Hello ${params.world}!`))

// app.hooks.addMiddleware(route.GET('/ping')(() => 'ping'))

Promise.resolve({ init: true })
  .then(app1.reduce)
  // .then(app2.reduce)
  .then(console.log)

app1.listen()