'use strict'

process.env.VIPS_WARNING = 0

// core
const url = require('url')
const crypto = require('crypto')

// npm
const got = require('got')
const sharp = require('sharp')

// self
const rewrite = require('../lib/parse')

// skip 0, 1, l, I and O alphanums
// const rePlainSig = /[abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g
// const plainSig = (str) => str.match(rePlainSig).join('')
const rePlainSig = /[abcdefghijkmnopqrstuvwxyz0123456789]/g
const plainSig = (str) => str.toLowerCase().match(rePlainSig).join('')

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

const toBase64 = (body) => {
  const hash = crypto.createHash('sha256')
  hash.update(body)
  return hash.digest('base64')
}

const blargh = (type, buffer, info) => {
  const hash = toBase64(buffer)
  const sig = plainSig(hash)
  const obj = { hash, sig }
  if (info) { obj.info = info }
  if (type === 'orig') { obj.buffer = buffer }
  return obj
}

const elProp = (z, resolve, reject) => {
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
}

const urlsFromDb = (x) => {
  if (!x.images) { return }
  const u = dbUrl(true)
  const auth = u.auth
  delete u.auth
  u.pathname = [u.pathname, '_all_docs'].join('/')
  u.query = { include_docs: true, keys: JSON.stringify(x.images.map((y) => y.src)) }
  return got(url.format(u), { json: true, auth })
}

const makeMultipart2 = (img, stuff) => {
  const body = img.body
  const boundary = '666abc123666'
  const headers = { 'Content-Type': `multipart/related;boundary=${boundary}` }
  stuff.createdAt = new Date().toISOString()
  // FIXME JPEG/PNG/GIF...
  stuff._attachments = {
    'jpeg.jpg': {
      follows: true,
      content_type: 'image/jpeg',
      length: body.length
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

const vava = (z, ya, n) => {
  if (!n) { n = 1 }
  const bodyImp = {
    _id: ya.raw.sig.slice(0, n),
    raw: ya.raw,
    orig: ya.orig,
    file: ya.file
  }

  const mm = makeMultipart2(z, bodyImp)
  const u = dbUrl(true)
  u.pathname = [u.pathname, bodyImp._id].join('/')
  const auth = u.auth
  delete u.auth

  const it = {
    auth,
    json: true,
    headers: mm.headers,
    body: mm.buffer
  }

  return Promise.all([
    z,
    got.put(url.format(u), it)
  ])
    .catch((e) => {
      if (e.statusCode === 409 && n < 15) { return vava(z, ya, n + 1) }
      return Promise.reject(e)
    })
}

const jala = (z, ya) => {
  delete ya.orig.buffer

  ya.createdAt = new Date().toISOString()
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
  ya.file = blargh('file', z.body)
  return vava(z, ya)
    .then((a) => {
      const doc = {
        _id: a[0].url,
        createdAt: new Date().toISOString(),
        headers: a[0].headers,
        imageId: a[1].body.id
      }

      const u = dbUrl(true)
      const auth = u.auth
      delete u.auth
      return got.post(url.format(u), {
        auth,
        json: true,
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(doc)
      }).then(() => {
        return {
          short: a[1].body.id,
          src: a[0].url
        }
      })
    })
}

const fn1 = (z) => new Promise(elProp.bind(this, z)).then(jala.bind(this, z))

const fn2 = (y, error) => {
  if (error.code === 'ENOTFOUND' || error.statusCode === 404) {
    const body = JSON.stringify({ _id: y.key, error, createdAt: new Date().toISOString() })
    const headers = { 'content-type': 'application/json' }
    const u = dbUrl(true)
    const auth = u.auth
    delete u.auth
    return got.post(url.format(u), { auth, json: true, body, headers })
  }
  console.log('wah!', error)
  y.otherError = error
  return y
}

const addMissingUrls = (x) => (!x || !x.body || !x.body.rows || !x.body.rows.length)
  ? []
  : Promise.all(x.body.rows.map((y) => {
    if (!y.error && !y.id) { return Promise.reject(new Error('Bad view result')) }
    if (!y.error && !y.value.deleted) { return y }
    return got(y.key, { encoding: null })
      .then(fn1)
      .catch(fn2.bind(this, y))
  }))

const newImage = (content) => rewrite.extractImages(content)
  .then(urlsFromDb)
  .then(addMissingUrls)
  .then((x) => x
    .map((y) => y.body || y)
    .map((y) => {
      if (y.short && y.src) { return y }
      if (y.doc && y.doc.imageId) { return { src: y.id, short: y.doc.imageId } }
      // probably an error
      if (y.ok && y.id.match(/https{0,1}:\/\//)) { return { src: y.id, type: 'maybeError' } }
      // also an error
      if (y.doc && y.doc.error) { return { src: y.doc._id, type: 'error' } }
      console.log('in all other cases...')
      return { y, type: 'thru' }
    })
  )
  .then((images) => {
    let out = content
    images.forEach((y) => {
      // FIXME JPEG/PNG/GIF...
      out = y.short
        ? out.replace(y.src, `/i/${y.short}-o.jpg`)
        : out.replace(y.src, '/i/404.jpg')
    })
    return { out, images }
  })

exports.newImage = newImage
