// Usage example with ExpressJS
const express = require('express');
const port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000;
const host = process.env.OPENSHIFT_NODEJS_IP || 'localhost';

const app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static('./'));

const galleryDir = 'gallery';
const title = 'TRON Collection';

app.use(`/${galleryDir}`, require('./lib/gallery.js')({
    staticFiles: `resources/${galleryDir}`,
    urlRoot: galleryDir,
    title,
    render: false,
}), function (req, res, next) {
    console.log(`Returning response for ${req.originalUrl}`);
    return res.render('gallery', {
        galleryHtml: req.html,
        title,
    });
});

app.listen(port, host);

console.log(`Web server listening on http://${host}:${port}/${galleryDir}`);
