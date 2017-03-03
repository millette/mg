'use strict'

// npm
const got = require('got')

const imageRoute = function (request, reply) {
  // FIXME DB
  got(`http://localhost:5990/mesting/${request.params.shortid}/jpeg.jpg`, { encoding: null })
    .then((x) => {
      // FIXME JPEG/PNG/GIF...
      reply(x.body).type('image/jpeg').etag(x.headers.etag.slice(1, -1))
    })
    .catch(reply)
}

exports.register = function (server, options, next) {
  server.route({
    path: '/img',
    method: 'get',
    handler: {
      view: {
        template: 'an-img'
      }
    }
  })

  server.route({
    path: '/i/404.jpg',
    method: 'get',
    handler: function (request, reply) {
      // FIXME JPEG/PNG/GIF...
      reply('Requested image could not be found.')
        .type('image/jpeg')
        .code(404)
        .etag('404')
    }
  })

  server.route({
    // FIXME JPEG/PNG/GIF...
    path: '/i/{shortid}-o.jpg',
    method: 'get',
    handler: imageRoute
  })

  next()
}

exports.register.attributes = {
  name: 'img',
  version: '0.0.0'
}
