'use strict'

// self
const pkg = require('../../package.json')

// core
const path = require('path')
const url = require('url')

// npm
const got = require('got')
const boom = require('boom')

const pluginOptions = {
  username: process.env.CLOUDANT_USERNAME,
  password: process.env.CLOUDANT_PASSWORD,
  dbName: process.env.CLOUDANT_DATABASE
}

const dbUrl = (auth) => {
  const urlObject = url.parse(`https://${pluginOptions.username}.cloudant.com/${pluginOptions.dbName}/`)
  if (auth) { urlObject.auth = [pluginOptions.username, pluginOptions.password].join(':') }
  return urlObject
}

const image404 = function (request, reply) {
  reply(boom.notFound('Requested image could not be found.'))
}

const imageRoute = function (request, reply) {
  const ext = path.extname(request.path)
  const u = dbUrl(true)
  const auth = u.auth
  delete u.auth
  u.pathname = [u.pathname, request.params.shortid, `jpeg${ext}`].join('/')
  const u2 = url.format(u)
  got(u2, { auth, encoding: null })
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
