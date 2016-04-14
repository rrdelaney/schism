'use strict'

module.exports = function (ctx) {
  if (ctx.req.method === 'OPTIONS') {
    return {
      $force: true,
      status: 204,
      body: 'options',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': 86400
      }
    }
  }

  return {
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
}
