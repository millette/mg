'use strict'

// npm
const callipyge = require('callipyge-core')

callipyge()
  .then((server) => console.log(`App running at: ${server.info.uri}`))
  .catch(console.error)
