'use strict'

const htmlparser = require('htmlparser2')
// const sharp = require('sharp')
// const got = require('got')

// taken from htmlparser2 lib/Parser.js
/*
const selfClosing = [
  'area',
  'base',
  'basefont',
  'br',
  'col',
  'command',
  'embed',
  'frame',
  'hr',
  'img',
  'input',
  'isindex',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',

  // common self closing svg elements
  'path',
  'circle',
  'ellipse',
  'line',
  'rect',
  'use',
  'stop',
  'polyline',
  'polygon'
]
*/

exports.extractImages = (cnt) => new Promise((resolve, reject) => {
  // let str = ''
  const images = []
  const other = []

  const onend = () => {
    const obj = { }
    const imgs = images.filter((url) => url.src)
    if (imgs.length) { obj.images = imgs }
    if (other.length) { obj.other = other }
    resolve(obj)
  }
  /*
  const onend = () => {
    resolve(images.filter((url) => url.src))
    Promise.all(images
      .filter((url) => url.src)
      .map(
        (url) => got(url.src)
          .then((x) => {
            return {
//              body: x.body,
              src: x.url,
              headers: x.headers,
              statusCode: x.statusCode
            }
          })
          .catch((error) => {
            return {
              src: url.src,
              error
            }
          })
      )
    )
      .then((dest) => {
        resolve({str, images, dest})
      })
  }
  */

  const onopentag = (name, attribs) => {
    /*
    str += '<' + name
    for (let r in attribs) { str += ` ${r}="${attribs[r]}"` }
    str += '>'
    */
    if (name === 'img') { images.push(attribs) }
  }

/*
  const onclosetag = (tagname) => {
    if (selfClosing.indexOf(tagname) === -1) { str += `</${tagname}>` }
  }
*/

  const parser = new htmlparser.Parser(
    {
      onopentag,
      onend,
      // onclosetag,
      onerror: reject,
      // ontext: (text) => { str += text },
      onprocessinginstruction: (name, data) => other.push({ name, data })
    },
    {
      decodeEntities: true,
      // recognizeSelfClosing: true,
      lowerCaseTags: true
    }
  )

  parser.write(cnt)
  parser.end()
})
