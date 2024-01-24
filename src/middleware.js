const express = require('express');
const fs = require('fs');
const path = require('path');

module.exports = function (config) {
    const app = express();
    const { staticFiles, verbose } = config;
    const common = require('./common')(config);
    const album = require('./album')(config);
    const photo = require('./photo')(config);
    const thumbnailMiddleware = require('./thumbnail-middleware')(config);

    const viewsDir = path.join(__dirname, '..', 'views');
    app.set('views', viewsDir);
    app.set('view engine', 'ejs');

    // Photos
    app.get(/.+(\.(jpg|bmp|jpeg|gif|png|tif)(\?tn=(1|0))?)$/i, function (req, res, next) {
        const filePath = decodeURIComponent(path.join(staticFiles, req.path));
        verbose && console.log('Handling image request', req.originalUrl);

        const stat = fs.statSync(filePath);
        if (!stat) {
            return common.error(req, res, next, 404, `File not found in middleware ${filePath}`);
        }

        if (req.query && req.query.tn && req.query.tn === '1') {
            return thumbnailMiddleware(req, res, next);
        }

        const fstream = fs.createReadStream(filePath);
        fstream.on('error', function (err) {
            verbose && console.log('fstream Error?', err);
            return common.error(req, res, next, 404, 'File not found', err);
        });

        // Return the full size file:
        return fstream.pipe(res);
    });

    // Photo Pages - anything containing */photo/*
    app.get(/(.+\/)?photo\/(.+)/i, photo, common.render);

    // Album Page - everything that doesn't contain the photo string
    // regex source http://stackoverflow.com/questions/406230/regular-expression-to-match-string-not-containing-a-word
    app.get(/^((?!\/photo\/).)*$/, album, common.render);

    return app;
};
