'use strict'

// self
const postUrl = require('../../lib/posturl')

// const re = /(<img[^]*src=[^]+?>)/g

const postHandler = function (request, reply) {
  const content = typeof request.payload === 'string'
    ? request.payload
    : request.payload.excerpt

  postUrl.newImage(content)
    .then((x) => {
      reply(x.out)
      // reply(content.match(re))
    })
}

exports.register = function (server, options, next) {
  server.route({
    path: '/excerpt',
    method: 'post',
    handler: postHandler
  })
  next()
}

exports.register.attributes = {
  name: 'api',
  version: '0.0.0'
}
