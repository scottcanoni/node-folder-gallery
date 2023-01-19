const express = require('express');
const nodeFolderGalleryMiddleware = require('node-folder-gallery');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('./'));

const galleryDir = 'gallery';
const title = 'My Gallery';

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
