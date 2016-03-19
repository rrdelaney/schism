'use strict'

const React = require('react')
const renderToString = require('react-dom/server').renderToString
const match = require('react-router').match
const RouterContext = require('react-router').RouterContext

module.exports = function router (routes) {
  return ctx => new Promise((resolve, reject) => {
    match({ routes, location: ctx.req.url }, (error, redirectLocation, renderProps) => {
      if (error) {
        reject(error)
      } else if (redirectLocation) {
        return resolve({
          status: 302,
          headers: {
            Location: redirectLocation.pathname + redirectLocation.search
          }
        })
      } else if (renderProps) {
        resolve(renderToString(React.createElement(RouterContext, renderProps)))
      } else {
        resolve()
      }
    })
  })
}
