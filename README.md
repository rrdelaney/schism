# Soular :sunny: :earth_americas: :crescent_moon: [![Build Status](https://travis-ci.org/rrdelaney/soular.svg?branch=master)](https://travis-ci.org/rrdelaney/soular) [![Coverage Status](https://coveralls.io/repos/github/rrdelaney/soular/badge.svg?branch=master)](https://coveralls.io/github/rrdelaney/soular?branch=master)

# What is it?
* Web server library
* Based on promises and a single state atom to handle concurrency

# Why use it?
* Small, easy to use (<100 LOC)
* 100% test coverage

# How does it work?
`Promise.all(middleware).then(mapResultToHttpResponse).catch(ErrorHandler)`

All middleware is run at the same time. Unused middleware should short circuit.
Running middleware relies on the `ctx.state` variable to communicate with other
middleware.

## Basic Example

```js
import soular from 'soular'

const getDBMiddleware = async ctx => {
  let db = await DBClient.getConnention()
  ctx.state.set('db', db)
}

const handler = async ctx => {
  const db = await ctx.state.get('db')
  const users = await db.getAllUsers()

  return {
    body: { users }
  }
}

soular('*')
  .use(getDBMiddleware)
  .use(handler)
  .listen()
```

## Routing

```js
import soular, { GET } from 'soular'

const getDB = async ctx => {
  const db = await DBClient.getConnention()
  ctx.state.set('db', db)
}

const getUsers = async ctx => {
  const db = await ctx.state.get('db')
  const users = await db.getAllUsers()

  return {
    body: { users }
  }
}

const getAdmins = async ctx => {
  const db = await ctx.state.get('db')
  const admins = await db.getAdmins()

  return {
    body: { admins }
  }
}

soular('*')
  .use(getDB)
  .use(GET('/users')(getUsers))
  .use(GET('/admins')(getAdmins))
  .listen()
```
