const express = require('express');
const nodeFolderGalleryMiddleware = require('node-folder-gallery');

const app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

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

// Make sure static serving is added AFTER the middleware above, so asset requests can be handled and thumbnails can be created automatically
app.use(express.static('./'));

app.listen(3000, 'localhost');

console.log(`Web server listening on http://localhost:3000/${galleryDir}`);
