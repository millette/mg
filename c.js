'use strict'

// core
const url = require('url')
const crypto = require('crypto')

// const fs = require('fs')
// const content = fs.readFileSync('cnt.txt')

// npm
const got = require('got')

// self
const rewrite = require('./lib/parse')

const content = `<p>Pif paf pow.
So it goes. <img src="http://bla.example.com/ok.jpg?boo&amp;ya"></p>
<h2>More stuff</h2>
Hmm, no tag?

<ul>
<li>List item!</li>
</ul>
<p>'nother image is <img src="http://robin.millette.info/api/aaa3/3c4e00304d305bafae810233171e9b5d/robin-mirroir-flop.jpg">
<p>Ciao!</p>`

const urlsFromDb = (x) => {
  if (!x.images) { return }
  const json = true
  const u = url.parse('http://localhost:5990/mesting/_all_docs')
  u.query = { keys: JSON.stringify(x.images.map((y) => y.src)) }
  return got(url.format(u), { json })
}

const addMissingUrls = (x) => {
  if (!x || !x.body || !x.body.rows || !x.body.rows.length) {
    console.log('nothing')
    return
  }

  return Promise.all(x.body.rows.map((y) => {
    if (!y.error && !y.id) { return Promise.reject(new Error('Bad view result')) }
    if (!y.error && !y.value.deleted) { return y }
    const json = true
    const createdAt = new Date().toISOString()
    // null encoding makes z.body a buffer
    return got(y.key, { encoding: null })
      .then((z) => {
        const hash = crypto.createHash('sha256')
        hash.update(z.body)
        const sha256hash = hash.digest('base64')
        const body = JSON.stringify({
          headers: z.headers,
          _id: y.key,
          sha256hash,
          createdAt,
          _attachments: {
            'jpeg.jpg': {
              content_type: 'image/jpeg',
              data: z.body.toString('base64')
            }
          }
        })
        return got.put('http://localhost:5990/mesting/' + encodeURIComponent(z.url), { body, json })
      })
      .catch((error) => {
        if (error.code === 'ENOTFOUND' || error.statusCode === 404) {
          const body = JSON.stringify({ _id: y.key, createdAt, error })
          const headers = { 'content-type': 'application/json' }
          return got.post('http://localhost:5990/mesting', { json, body, headers })
        }
        console.log('wah!', error)
        y.otherError = error
        return y
      })
  }))
}

rewrite.extractImages(content)
  .then(urlsFromDb)
  .then(addMissingUrls)
  .then((x) => {
    // console.log(Object.keys(x[0]))
    // console.log(Object.keys(x[1]))
    console.log('ok dear')
  })
  .catch((e) => {
    console.error('eur!', e)
  })
