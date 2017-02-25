'use strict'

// core
const url = require('url')

// npm
const got = require('got')
const crypto = require('crypto')

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
  const u = url.parse('http://localhost:5990/mesting/_all_docs')
  u.query = { keys: JSON.stringify(x.images.map((y) => y.src)) }
  return got(url.format(u), { json: true })
}

const toBase64 = (body) => {
  const hash = crypto.createHash('sha256')
  hash.update(body)
  return hash.digest('base64')
}

const makeMultipart = (img) => {
  const body = img.body
  const boundary = '666abc123666'
  const headers = { 'Content-Type': `multipart/related;boundary=${boundary}` }
  const sha256hash = toBase64(body)

  const stuff = {
    _id: img.url,
    sha256hash,
    createdAt: new Date().toISOString(),
    headers: img.headers,
    _attachments: {
      'jpeg.jpg': {
        follows: true,
        content_type: 'image/jpeg',
        length: body.length
      }
    }
  }

  const buffers = [
    Buffer.from(`--${boundary}
Content-Type: application/json

${JSON.stringify(stuff)}
--${boundary}
Content-Type: image/jpeg

`.replace(/\n/g, '\r\n')),
    body,
    Buffer.from(`
--${boundary}--`.replace(/\n/g, '\r\n'))
  ]
  return { headers, buffer: Buffer.concat(buffers) }
}

const fn1 = (z) => {
  const mm = makeMultipart(z)
  const it = {
    json: true,
    headers: mm.headers,
    body: mm.buffer
  }

  const u = [
    'http://localhost:5990/mesting',
    encodeURIComponent(z.url)
  ].join('/')
  return got.put(u, it)
}

const fn2 = (_id, error) => {
  if (error.code === 'ENOTFOUND' || error.statusCode === 404) {
    const body = JSON.stringify({ _id, error, createdAt: new Date().toISOString() })
    const headers = { 'content-type': 'application/json' }
    return got.post('http://localhost:5990/mesting', { json: true, body, headers })
  }
  console.log('wah!', error)
  y.otherError = error
  return y
}

const addMissingUrls = (x) => {
  if (!x || !x.body || !x.body.rows || !x.body.rows.length) {
    console.log('nothing')
    return
  }

  return Promise.all(x.body.rows.map((y) => {
    if (!y.error && !y.id) { return Promise.reject(new Error('Bad view result')) }
    if (!y.error && !y.value.deleted) { return y }
    // null encoding makes z.body a buffer
    return got(y.key, { encoding: null })
      .then(fn1)
      .catch(fn2.bind(this, y.key))
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
