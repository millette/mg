'use strict'

process.env.VIPS_WARNING = 0

// core
const url = require('url')

// npm
const got = require('got')
const crypto = require('crypto')
const sharp = require('sharp')

// self
const rewrite = require('./lib/parse')

// skip 0, 1, l, I and O alphanums
const rePlainSig = /[abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g
const plainSig = (str) => str.match(rePlainSig).join('')

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

/*
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
*/

/*
New URL

Fetch image from URL

Do we know this hash?

*/

const blargh = (type, buffer, info) => {
  // if (err) { return reject(err) }
  const hash = toBase64(buffer)
  const sig = plainSig(hash)

  const obj = { info, hash, sig }

  if (type === 'orig') {
    obj.buffer = buffer
  }

  return obj
  // if (retObj.orig && retObj.raw) { resolve(retObj) }
}

const vava = (ya, n) => {
  if (!n) { n = 1 }
  const body = JSON.stringify({
    _id: ya.raw.sig.slice(0, n || 1),
    raw: ya.raw,
    orig: ya.orig
  })
  const headers = { 'content-type': 'application/json' }
  return got.post('http://localhost:5990/mesting', { json: true, body, headers })
    .catch((e) => {
      if (e.statusCode === 409) { return vava(ya, n + 1) }
      return Promise.reject(e)
    })
}

const fn1 = (z) => {
/*
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
*/

  return new Promise((resolve, reject) => {
    const retObj = {}
    sharp(z.body)
      .toBuffer((err, buffer, info) => {
        if (err) { return reject(err) }
        retObj.orig = blargh('orig', buffer, info)
        if (retObj.orig && retObj.raw) { resolve(retObj) }
      })
      .raw()
      .toBuffer((err, buffer, info) => {
        if (err) { return reject(err) }
        retObj.raw = blargh('raw', buffer, info)
        if (retObj.orig && retObj.raw) { resolve(retObj) }
      })
  })
    .then((ya) => {
      console.log(typeof ya)
      console.log(Object.keys(ya))
      console.log(Object.keys(ya.orig))
      console.log(Object.keys(ya.raw))

      console.log(ya.orig.info)
      console.log(ya.orig.hash)
      console.log(ya.orig.sig)

      console.log(ya.raw.info)
      console.log(ya.raw.hash)
      console.log(ya.raw.sig)

      // const origBuffer = Buffer.from(ya.orig.buffer)
      delete ya.orig.buffer

      ya.raw.format = ya.raw.info.format
      ya.raw.width = ya.raw.info.width
      ya.raw.height = ya.raw.info.height
      ya.raw.channels = ya.raw.info.channels
      ya.raw.size = ya.raw.info.size

      ya.orig.format = ya.orig.info.format
      ya.orig.width = ya.orig.info.width
      ya.orig.height = ya.orig.info.height
      ya.orig.channels = ya.orig.info.channels
      ya.orig.size = ya.orig.info.size

      delete ya.raw.info
      delete ya.orig.info

      return vava(ya)
        .then((a) => {
          console.log(a.headers)
          console.log(a.body)
          return a
        })
        .catch(console.error)
/*
      const body = JSON.stringify({
        _id: ya.raw.sig.slice(0, 1),
        raw: ya.raw,
        orig: ya.orig
      })
      const headers = { 'content-type': 'application/json' }
      console.log('body:', body)
      got.post('http://localhost:5990/mesting', { json: true, body, headers })
        .then((fl) => {
          console.log('FL:', fl.body)
        })
        .catch(console.error)
*/

      // At this point, we have the original format buffer
      // and the info, hash and sig of both raw and original.

      // Do we have a doc with the raw hash?
      //  NO, we must insert it with a short ID
      //    Start with raw.sig.slice(0, 1)
      //    If Put conflict, try raw.sig.slice(0, 2), etc.
      //  If so, does the raw info correspond?
      //    If so, does the doc have the same orig hash too?
      //      If so, does the orig info correspond?

      // return 'yo!'
    })
}

const fn2 = (y, error) => {
  if (error.code === 'ENOTFOUND' || error.statusCode === 404) {
    const body = JSON.stringify({ _id: y._id, error, createdAt: new Date().toISOString() })
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
      .catch(fn2.bind(this, y))
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
