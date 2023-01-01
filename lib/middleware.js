const express = require('express');
const fs = require('fs');
const path = require('path')
const crypto = require('crypto');
const cache = require('memory-cache');
const im = require('imagemagick-stream');

module.exports = function (config) {
    const app = express();
    const staticFiles = config.staticFiles;
    const common = require('./common')(config);
    const album = require('./album')(config);
    const photo = require('./photo')(config);

    app.set('views', path.join(__dirname, '..', 'views'));
    app.set('view engine', 'ejs');

    // app.get('/gallery.css', function (req, res, next) {
    //     const fstream = fs.createReadStream(path.join(__dirname, '..', 'css/gallery.css'));
    //     res.type('text/css');
    //     fstream.on('error', function (err) {
    //         return common.error(req, res, next, 404, 'CSS File not found', err);
    //     });
    //     return fstream.pipe(res);
    // });

    // Thumbnail


    // Photo Page
    app.get(/.+(\.(jpg|bmp|jpeg|gif|png|tif)(\?tn=(1|0))?)$/i, function (req, res, next) {
        const filePath = decodeURIComponent(path.join(staticFiles, req.path));

        fs.stat(filePath, function (err) {
            if (err) {
                return common.error(req, res, next, 404, 'File not found', err);
            }
            const fstream = fs.createReadStream(filePath);
            fstream.on('error', function (err) {
                return common.error(req, res, next, 404, 'File not found', err);
            });

            if (!req.query.tn) {
                // return the full size file
                return fstream.pipe(res);
            }

            // streaming resize our file
            let dimensions;
            let w;
            let h;
            if (req.query.tn.toString() === '1') {
                w = (config.thumbnail && config.thumbnail.width) || 200;
                h = (config.thumbnail && config.thumbnail.height) || 200;
                dimensions = w + 'x' + h;
            }
            else {
                w = (config.image && config.image.width) || '100%';
                h = (config.image && config.image.height) || '100%';
                dimensions = w + 'x' + h;

                if (w === '100%' && h === '100%') {
                    // return the full size file
                    return fstream.pipe(res);
                }
            }

            let cachedResizedKey = filePath + dimensions;
            cachedResizedKey = crypto.createHash('md5').update(cachedResizedKey).digest('hex');

            // Check the cache for a previously resized thumbnail of matching file path and dimensions
            const cachedResult = cache.get(cachedResizedKey);
            // TODO - eventually should just try the fs.read on cachedResult, existsSync is a bad hack
            if (cachedResult && fs.existsSync(cachedResult)) {
                // cache hit - read & return
                const cacheReadStream = fs.createReadStream(cachedResult);
                cacheReadStream.on('error', function () {
                    return common.error(req, res, next, 404, 'File not found', err);
                });
                return cacheReadStream.pipe(res);
            }

            // No result, create write stream, then resize the image, and cache it
            const cacheWritePath = path.join('./tmp', cachedResizedKey);
            const cacheWriteStream = fs.createWriteStream(cacheWritePath);

            const resizer = im().resize(dimensions).quality(40);
            resizer.on('error', function (err) {
                return common.error(req, res, next, 500, 'Error in IM/GM converting file', err);
            });

            const resizeStream = fstream.pipe(resizer);

            // Pipe to our tmp cache file, so we can use this in future
            resizeStream.pipe(cacheWriteStream);
            cache.put(cachedResizedKey, cacheWritePath);

            // Also stream the resized result back as the response
            return resizeStream.pipe(res);
        });
    });

    // Photo Pages - anything containing */photo/*
    app.get(/(.+\/)?photo\/(.+)/i, photo, common.render);

    // Album Page - everything that doesn't contain the photo string
    // regex source http://stackoverflow.com/questions/406230/regular-expression-to-match-string-not-containing-a-word
    app.get(/^((?!\/photo\/).)*$/, album, common.render);
    return app;
};
