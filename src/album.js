const fs = require('fs');
const path = require('path');
const cache = require('memory-cache');
const isPhoto = /(\.(jpg|bmp|jpeg|gif|png|tif))$/i;

let config;

module.exports = function (cfg) {
    config = cfg;
    const common = require('./common')(config);
    const thumbnailMiddleware = require('./thumbnail-middleware')(config);

    return function (req, res, next) {
        // Retrieve the path, decoding %20s etc., replacing leading & trailing slash
        const pathFromReq = common.friendlyPath(req.path);
        const staticFilesPath = path.join('.', config.staticFiles, pathFromReq);
        const data = {
            ...config,
        };

        // Request for an album thumbnail
        if (req.query.tn === '1') {
            config.verbose && console.log('Request is for thumbnail of: ', req.originalUrl);
            return getThumbnailForAlbum(staticFilesPath, pathFromReq, function (err, thumb) {
                if (err) {
                    return common.error(req, res, next, 404, 'No getThumbnailForAlbum found for this album', err);
                }

                req.albumThumbnail = thumb;

                return thumbnailMiddleware(req, res, next);
            });
        }

        const files = fs.readdirSync(staticFilesPath);
        if (!files) {
            return common.error(req, res, next, 404, 'No album files found');
        }

        const breadcrumb = common.breadcrumb(pathFromReq);
        const friendlyPrefix = breadcrumb && breadcrumb.length ? breadcrumb[breadcrumb.length - 1].name : config.title;
        data.isRoot = (req.path === '/' || req.path === '');
        data.breadcrumb = breadcrumb;
        data.name = friendlyPrefix;
        data.albums = getAlbums(files, staticFilesPath, pathFromReq);
        data.photos = getPhotos(files, staticFilesPath, pathFromReq, friendlyPrefix);
        req.data = data;
        req.tpl = 'album.ejs';
        return next();
    };
};

function getAlbums(files, staticFilesPath, pathFromRequest) {
    const cleanedPath = pathFromRequest.replace(/#/g, '%23');
    const filteredFiles = files.filter((file) => {
        const stat = fs.statSync(path.join(staticFilesPath, file));
        return stat.isDirectory();
    });

    return filteredFiles.map((albumName) => {
        return {
            url: path.join(config.urlRoot, cleanedPath, albumName),
            thumbnail: path.join(config.urlRoot, 'thumbnail', cleanedPath, albumName),
            name: albumName,
            pathFromRequest,
        };
    });
}

function getPhotos(files, staticFilesPath, pathFromRequest, friendlyPrefix) {
    const cleanedPath = pathFromRequest.replace(/#/g, '%23');

    const filteredFiles = files.filter((file) => {
        const stat = fs.statSync(path.join(staticFilesPath, file));
        return file.match(isPhoto) && !stat.isDirectory();
    });

    return filteredFiles.map((photoFileName, fileIndex) => {
        const photoName = photoFileName.replace(isPhoto, '');

        return {
            url: path.join(config.urlRoot, cleanedPath, 'photo', photoName),
            hashEncodedURL: path.join(config.urlRoot, cleanedPath, 'photo', photoName),
            src: path.join(config.urlRoot, cleanedPath, photoFileName),
            thumbnail: path.join(config.urlRoot, 'thumbnail', cleanedPath, photoFileName),
            path: path.join(cleanedPath, photoFileName),
            pathFromRequest: path.join(pathFromRequest, photoFileName),
            name: photoName,
            friendlyName: `${friendlyPrefix} #${fileIndex + 1}`,
            photoFileName,
        };
    });
}

function getThumbnailForAlbum(albumPath, pathFromRequest, cb) {
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
            return getThumbnailForAlbum(path.join(albumPath, firstAlbum), path.join(pathFromRequest, firstAlbum), cb);
        }
        else {
            // None exist
            return cb('No suitable getThumbnailForAlbum found');
        }
    });
}
