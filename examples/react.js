'use strict'

let soular = require('../soular')
let router = require('../react-router')
let ping = require('../ping')
let React = require('react')

let Top = React.createClass({
  render () {
    return React.createElement('div', null, this.props.children || 'Hello!!!')
  }
})

let A = React.createClass({
  render () {
    return React.createElement('div', null, 'AAA!!!')
  }
})

let B = React.createClass({
  render () {
    return React.createElement('div', null, 'BBB!!!')
  }
})

let routes = {
  path: '/',
  component: Top,
  childRoutes: [
    { path: 'A', component: A },
    { path: 'B', component: B }
  ]
}

soular('*')
  .use(ping)
  .use(router(routes))
  .listen(3000)
