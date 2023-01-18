Node Folder Gallery
====

Display a gallery of images and folders, with an easy to browse interface.  Allows for deep linking to specific folders and images.

Features:
----

1. Very few dependencies.
2. Easy to style with your own CSS.
3. Automatic discovery of sub-folders and images within `gallery` folder.
4. Album view for folders, and Photo view for individual images.
5. Photo information embedded in the file (EXIF) will be displayed on the photo page.
6. Support for folders/albums with the `#` symbol, helpful for collections of items that are numbered or duplicate.
7. Image filenames will automatically be named after the folder with a sequential # following each image.

Dependencies:
----

1. ExpressJS to serve pages and handle requests for thumbnails.
2. Imagemagik to create thumbnails.
3. Exif to read image metadata.
4. Memory Cache to save generated thumbnails for performance reasons.

Install
----

Node Folder Gallery is an Express Middleware so you can 

1. `yarn add node-folder-gallery` or `npm install node-folder-gallery`
2. Create a directory named `gallery` with some photos or folders of photos.
3. Create a file named `app.js`, example below.
4. Create a 

Usage
----

app.js
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
}), function (req, res, next) {
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

ImageMagick
----
Node Folder Gallery requires ImageMagick. Installation instructions for mac can be found at

For Windows, select the specific imagemagick installer for your system, e.g., http://sourceforge.net/projects/imagemagick/files/6.8.9-exes/ImageMagick-6.8.9-4-Q16-x64-dll.exe/download

For Mac, install imagemagick from: http://www.imagemagick.org/script/binary-releases.php#macosx

1. Install imagemagick
2. Make sure that imagemagick tools are available on system path (e.g., you can test if you can run "convert.exe" from CMD)
3. Restart cygwin, CMD or whatever you use to fire up node.js

Run Locally
----

To run demo locally:

- `yarn`
- `yarn start`

then open a browser to  http://localhost:3000/gallery.

Future Ideas
----

- Config flag for showing friendly incrementing image name based on directory name
- Add config flag to not return styles

Notes
----

I created this because I needed my own image gallery organized by folders of images for my own collection. I found (node-gallery|https://github.com/cianclarke/node-gallery) but it didn't work for me
fully, and I noticed it hadn't been updated in over 8 years plus it had opened pull requests and vulnerable dependencies.

Thus, Node Folder Gallery was born.

The images used in this repo are all from the Public Domain and are used as an example.  If the website that provided these to me lied, let me know and I can swap them out.
