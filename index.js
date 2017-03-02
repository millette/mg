'use strict'

// npm
const callipyge = require('callipyge-core')

const init = (server) => {
  server.route({
    path: '/form',
    method: 'get',
    handler: function (request, reply) {
      reply.view('form', {})
    }
  })

  server.register(require('./plugins/api'), { routes: { prefix: '/api' } })
  server.register(require('./plugins/img'))
  return server
}

callipyge(init)
  .then((server) => console.log(`App running at: ${server.info.uri}`))
  .catch(console.error)
