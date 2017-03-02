'use strict'

const yay = require('./lib/posturl')

const content = `<p>Pif paf pow.
So it goes. <img src="https://file.army/content/images/users/799Wf/av_14883427755.jpg?778"></p>
<h2>More stuff</h2>
Hmm, no tag?

<ul>
<li>List item!</li>
</ul>
<p>'nother image is <img src="http://robin.millette.info/api/aaa3/3c4e00304d305bafae810233171e9b5d/robin-mirroir-flop.jpg">
<p>Ciao!</p>`

yay.newImage(content)
  .then((x) => {
    console.log(x)
    /*
    console.log(x.length)
    // console.log(Object.keys(x[0]))
    console.log(x[0])
    // console.log(Object.keys(x[1]))
    console.log(x[1])
    */
  })
