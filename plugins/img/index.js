'use strict'

// npm
const got = require('got')

const imageRoute = function (request, reply) {
  got(`http://localhost:5990/mesting/${request.params.shortid}/jpeg.jpg`, { encoding: null })
    .then((x) => {
      // console.log('H:', x.headers)
      reply(x.body).type('image/jpeg').etag(x.headers.etag.slice(1, -1))
    })
  /*
  reply(
    got(`http://localhost:5990/mesting/${request.params.shortid}/jpeg.jpg`, { encoding: null })
      .then((x) => x.body)
  ).type('image/jpeg')
  // ).header('content-type', 'image/jpeg')
  */

/*
  console.log(request.params)
  reply.redirect(
`http://localhost:5990/mesting/${request.params.shortid}/jpeg.jpg`
  )
*/
  // reply.view('an-img', { params: request.params })
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
    path: '/i/{shortid}-o.jpg',
    method: 'get',
    handler: imageRoute
/*
    handler: {
      view: {
        template: 'an-img'
      }
    }
*/
  })

  next()
}

exports.register.attributes = {
  name: 'img',
  version: '0.0.0'
}
