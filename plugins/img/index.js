'use strict'

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
  next()
}

exports.register.attributes = {
  name: 'img',
  version: '0.0.0'
}
