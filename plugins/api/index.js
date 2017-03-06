'use strict'

// self
const pkg = require('../../package.json')
const postUrl = require('../../lib/posturl')

const postHandler = function (request, reply) {
  const content = typeof request.payload === 'string'
    ? request.payload
    : request.payload.excerpt

  postUrl.newImage(content)
    .then((x) => {
      if (typeof request.payload === 'string') { return reply(x) }
      reply.view('mg', x)
    })
}

exports.register = function (server, options, next) {
  server.route({
    path: '/excerpt',
    method: 'post',
    config: {
      auth: {
        strategy: 'password',
        mode: 'required'
      }
    },
    handler: postHandler
  })
  next()
}

exports.register.attributes = {
  name: 'api',
  version: pkg.version
}
