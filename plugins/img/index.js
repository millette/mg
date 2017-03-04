'use strict'

// self
const pkg = require('../../package.json')

// core
const path = require('path')

// npm
const got = require('got')
const boom = require('boom')

const image404 = function (request, reply) {
  reply(boom.notFound('Requested image could not be found.'))
}

const imageRoute = function (request, reply) {
  const ext = path.extname(request.path)
  // FIXME DB
  got(`http://localhost:5990/mesting/${request.params.shortid}/jpeg${ext}`, { encoding: null })
    .then((x) => {
      reply(x.body).type(x.headers['content-type']).etag(x.headers.etag.slice(1, -1))
    })
    .catch(() => image404(request, reply))
}

exports.register = function (server, options, next) {
  server.route({
    path: '/i/404.{ext}',
    method: 'get',
    handler: image404
  })

/*
  server.route({
    path: '/i/404.jpg',
    method: 'get',
    handler: image404
  })

  server.route({
    path: '/i/404.png',
    method: 'get',
    handler: image404
  })

  server.route({
    path: '/i/404.gif',
    method: 'get',
    handler: image404
  })
*/

  server.route({
    path: '/i/{shortid}-o.jpg',
    method: 'get',
    handler: imageRoute
  })

  server.route({
    path: '/i/{shortid}-o.png',
    method: 'get',
    handler: imageRoute
  })

  server.route({
    path: '/i/{shortid}-o.gif',
    method: 'get',
    handler: imageRoute
  })

  next()
}

exports.register.attributes = {
  name: 'img',
  version: pkg.version
}
