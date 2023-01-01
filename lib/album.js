const fs = require('fs');
const path = require('path');
const cache = require('memory-cache');
const isPhoto = /(\.(jpg|bmp|jpeg|gif|png|tif))$/i;
const _ = require('underscore');

let common;
let config;

module.exports = function (cfg) {
    config = cfg;
    common = require('./common')(config);
    return function (req, res, next) {

        // Retrieve the path, decoding %20s etc., replacing leading & trailing slash
        const pathFromReq = common.friendlyPath(req.path);
        const staticFilesPath = path.join('.', config.staticFiles, pathFromReq);
        const data = _.clone(config);

        // Request for an album thumbnail - TODO consider splitting out
        if (req.query && req.query.tn && req.query.tn === "1") {
            return thumbnail(staticFilesPath, pathFromReq, function (err, thumb) {
                if (err) {
                    return common.error(req, res, next, 404, 'No thumbnail found for this album', err);
                }
                const fstream = fs.createReadStream(path.join(thumb));
                fstream.on('error', function (err) {
                    return common.error(req, res, next, 404, 'No thumbnail found for this album', err);
                });
                return fstream.pipe(res);
            });
        }

        // Determined we're not requesting the thumbnail file - render the album page
        fs.readdir(staticFilesPath, function (err, files) {
            if (err) {
                return common.error(req, res, next, 404, 'No album found', err);
            }

            data.isRoot = (req.path === '/' || req.path === '');
            data.breadcrumb = common.breadcrumb(pathFromReq);
            data.name = _.last(data.breadcrumb).name || config.title;
            data.albums = getAlbums(files, staticFilesPath, pathFromReq);
            data.photos = getPhotos(files, staticFilesPath, pathFromReq);

            req.data = data;
            req.tpl = 'album.ejs';
            return next();
        });
    };
};

function getAlbums(files, staticFilesPath, pathFromRequest) {
    const cleanedPath = pathFromRequest.replace(/#/g, '%23');

    files = _.filter(files, function (file) {
        const stat = fs.statSync(path.join(staticFilesPath, file));
        return stat.isDirectory();
    });

    files = _.map(files, function (albumName) {
        return {
            url: path.join(config.urlRoot, cleanedPath, albumName),
            thumbnail: path.join(config.urlRoot, 'thumbnail', cleanedPath, albumName),
            name: albumName,
            pathFromRequest,
        };
    });
    return files;
}

function getPhotos(files, staticFilesPath, pathFromRequest) {
    console.log('getPhotos pathFromReq', pathFromRequest);
    const cleanedPath = pathFromRequest.replace(/#/g, '%23');
    files = _.filter(files, function (file) {
        const stat = fs.statSync(path.join(staticFilesPath, file));
        return file.match(isPhoto) && !stat.isDirectory();
    });
    files = _.map(files, function (photoFileName) {
        const photoName = photoFileName.replace(isPhoto, '');

        return {
            url: path.join(config.urlRoot, cleanedPath, 'photo', photoName),
            hashEncodedURL: path.join(config.urlRoot, cleanedPath, 'photo', photoName),
            src: path.join(config.urlRoot, cleanedPath, photoFileName),
            thumbnail: path.join(config.urlRoot, 'thumbnail', cleanedPath, photoFileName),
            path: path.join(cleanedPath, photoFileName),
            pathFromRequest: path.join(pathFromRequest, photoFileName),
            name: photoName,
            photoFileName,
        };
    });

    return files;
}

function thumbnail(albumPath, pathFromRequest, cb) {
    const cached = cache.get(albumPath);
    if (cached) {
        return cb(null, cached);
    }

    // TODO - This is a bit messy - reduce number of params we need to pass
    fs.readdir(albumPath, function (err, files) {
        const photos = getPhotos(files, albumPath, pathFromRequest);
        const albums = getAlbums(files, albumPath, pathFromRequest);
        if (photos.length > 0) {
            // We have a photo, let's return the first as the thumb
            const firstPhoto = path.join(config.staticFiles, photos[0].pathFromRequest);

            cache.put(albumPath, firstPhoto);

            return cb(null, firstPhoto);
        }
        else if (albums.length > 0) {
            // No photos found - iterate thru the albums and find a suitable child to return
            // TODO: If this first sub-album is empty this will fail. Is this OK?
            const firstAlbum = albums[0].name;
            return thumbnail(path.join(albumPath, firstAlbum), path.join(pathFromRequest, firstAlbum), cb);
        }
        else {
            // None exist
            return cb('No suitable thumbnail found');
        }
    });
}
