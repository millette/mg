# MG

## Parse excerpt
Read given html and identify image urls.

## Check db for image urls
Is this url already known?

### Unknown url
* Fetch image (url)
* Keep meta-data (size, width, height, type, exif)
* Calculate image hash
// * doc._id = size-width-height-type-hash.slice(0, 10)
* doc._id = hash.slice(0, 10)
* Does this doc already exists?
  * NO: unknown, go on
  * YES! Is it the same hash, size, width, height and type?
    * NO: unknown, go on
    * YES!
* Store doc with image attachment

### Known url
We're done processing images!

------

URL-a -> IMG-a
URL-b -> IMG-b
URL-c -> IMG-a
URL-d -> IMG-c
URL-e -> IMG-d


Docs

url-a, url-b, url-c, url-d, url-e,
img-a, img-b, img-c, img-d

{ _id: url-a, imgid: img-a }
{ _id: url-b, imgid: img-b }
{ _id: url-c, imgid: img-a }
{ _id: url-d, imgid: img-c }
{ _id: url-e, imgid: img-d }

{ _id: img-a, hash: '...' }
{ _id: img-b, hash: '...' }
{ _id: img-c, hash: '...' }
{ _id: img-d, hash: '...' }
