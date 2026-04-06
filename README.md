Node Folder Gallery
====

Just fill the `/gallery` directory with folders of images and GO! Instant gallery with thumbnails and folder and file views.

Display a gallery of images and folders with thumbnails using Node. Allows deep linking to specific folders and images, with EXIF data on the photo page. Uses Express, EJS, [Sharp](https://sharp.pixelplumbing.com/), [exifr](https://github.com/MikeKovarik/exifr), and memory cache.

**Requirements:** Node.js `^18.18.0` or `>=20` (see `engines` in `package.json`). Dependencies include **Express 5** and **EJS 5** (see `package.json`). Thumbnails are built with [Sharp](https://sharp.pixelplumbing.com/) (prebuilt [libvips](https://libvips.github.io/libvips/) binaries on supported platforms). Unusual environments (Alpine, air‑gapped installs, rare CPU arches) should follow Sharp’s [installation guide](https://sharp.pixelplumbing.com/install). If your host app still uses Express 4, you can usually keep it; this library bundles its own Express for the gallery router. For upgrading an app to Express 5, see the [migration guide](https://expressjs.com/en/guide/migrating-5.html).

Demo
----

[DEMO](https://t81047.sse.codesandbox.io/)

[CodeSandbox](https://codesandbox.io/s/node-folder-gallery-example-t81047)

Features:
----

1. Automatic discovery of sub-folders and images within your `gallery` folder.
2. Album view for folders, and Photo view for individual images.
3. Easy to style with your own CSS.
4. Photo information embedded in the file (EXIF) will be displayed on the photo page.
5. Support for folders/albums with the `#` symbol, helpful for collections of items that are numbered or duplicate.
6. Image filenames will automatically be named after the folder with a sequential # following each image.

Dependencies:
----

1. Express to serve pages and handle requests for thumbnails.
2. Sharp to create thumbnails (libvips via npm on supported platforms).
3. exifr to read image metadata.
4. Memory cache to save generated thumbnails for performance.


Run
----

To run the demo locally:

1. Run `git clone https://github.com/scottcanoni/node-folder-gallery.git`
2. Run `cd ./node-folder-gallery`
3. Run `npm install`
4. Run `npm start`

Then open a browser to `http://localhost:3000/gallery`.


Integrate
----

Node Folder Gallery is Express middleware you connect to your existing project, or use it to start a new project easily.

1. Run `npm install node-folder-gallery`
2. Copy the contents of the `./example` folder from this repository into your project (or mirror its layout).
3. Fill the directory named `./gallery` with your own photos or folders of photos.
4. Optionally change `index.js` to set your own title (see below).
5. Run `node ./index.js`


index.js
-------

```js
const express = require('express');
const nodeFolderGalleryMiddleware = require('node-folder-gallery');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('./'));

const galleryDir = 'gallery';
const title = 'My Action Figure Collection';

app.use(`/${galleryDir}`, nodeFolderGalleryMiddleware({
    staticFiles: `${galleryDir}`,
    urlRoot: galleryDir,
    title,
}), function (req, res) {
    console.log(`Returning response for ${req.originalUrl}`);
    return res.render(galleryDir, {
        galleryHtml: req.html,
        urlRoot: galleryDir,
        title,
    });
});

app.listen(3000, 'localhost');

console.log(`Web server listening on http://localhost:3000/${galleryDir}`);
```

Thumbnails and Sharp
----

Thumbnails are generated with Sharp. For most Linux, macOS, and Windows installs, `npm install` is enough. If `npm install` fails to load Sharp’s native binary, see [Sharp installation](https://sharp.pixelplumbing.com/install) (Docker, Alpine, proxies, etc.).

Future Ideas
----

- Config flag for disabling of the friendly incrementing image name based on directory name
- Config flag to not return styles

Notes
----

I created this because I needed my own image gallery organized by folders of images for my own collection. I found [node-gallery](https://github.com/cianclarke/node-gallery), but it didn't work for me
fully, and I noticed it hadn't been updated in over 8 years plus it had opened pull requests and vulnerable dependencies.

Thus, Node Folder Gallery was born.

The images used in this repo are all from the Public Domain and are used as an example. If the website that provided these to me lied, let me know and I can swap them out.
