'use strict'

let GET = require('./route').GET

module.exports = GET('/ping')(_ => 'pong')
