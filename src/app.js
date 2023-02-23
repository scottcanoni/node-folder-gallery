// Usage example with ExpressJS
const express = require('express');
const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';

const app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

const galleryDir = 'gallery';
const title = 'Image Collection';

app.use(`/${galleryDir}`, require('./gallery.js')({
    staticFiles: `/${galleryDir}`,
    urlRoot: galleryDir,
    title,
    render: false,
}), function (req, res, next) {
    console.log(`Returning response for ${req.originalUrl}`);
    return res.render('gallery', {
        galleryHtml: req.html,
        urlRoot: galleryDir,
        title,
    });
});

app.listen(port, host);

console.log(`Web server listening at: http://${host}:${port}/${galleryDir}`);
