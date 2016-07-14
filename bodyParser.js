'use strict'

module.exports = function (ctx) {
  return new Promise(resolve => {
    let body = []

    ctx.req
    .on('data', chunk => body.push(chunk))
    .on('end', () => {
      let fullBody = Buffer.concat(body).toString()

      if (fullBody.startsWith('{') && fullBody.endsWith('}')) {
        ctx.state.body = JSON.parse(fullBody)
      } else {
        ctx.state.body = fullBody
      }

      resolve()
    })
  })
}
