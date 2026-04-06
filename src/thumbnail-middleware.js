const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cache = require('memory-cache');
const sharp = require('sharp');
const paths = require('./paths');

module.exports = function (config) {
    const common = require('./common')(config);
    const { staticFiles, cacheDir, verbose } = config;

    return function thumbnailHandler(req, res, next) {
        let filePath;
        if (req.albumThumbnail) {
            filePath = paths.resolveUnderStatic(staticFiles, req.albumThumbnail);
            if (!filePath) {
                return common.error(req, res, next, 400, 'Invalid path');
            }
        }
        else {
            filePath = paths.resolveRequestPath(staticFiles, req.path);
            if (!filePath) {
                return common.error(req, res, next, 400, 'Invalid path');
            }
        }

        let stat;
        try {
            stat = fs.statSync(filePath);
        }
        catch (err) {
            return common.error(req, res, next, 404, 'File not found', err);
        }
        if (!stat.isFile()) {
            return common.error(req, res, next, 404, 'Not a file');
        }

        const width = config.thumbnail.width;
        const height = config.thumbnail.height;
        const dimensions = `${width}x${height}`;
        const albumKey = req.albumThumbnail || '';
        const cachedThumbnailUniqueTraits = filePath + dimensions + albumKey;
        const cachedThumbnailKey = crypto.createHash('md5').update(cachedThumbnailUniqueTraits).digest('hex');

        // Check the cache for a previously resized thumbnail of matching file path and dimensions
        const cachedResult = cache.get(cachedThumbnailKey);

        if (cachedResult && fs.existsSync(cachedResult)) {
            verbose && console.log('Returning cache for ', cachedThumbnailKey, filePath);
            // cache hit - read & return
            const cacheReadStream = fs.createReadStream(cachedResult);
            cacheReadStream.on('error', function (err) {
                return common.error(req, res, next, 404, 'Cache file not found', err);
            });
            res.setHeader('Content-Type', 'image/jpeg');
            return cacheReadStream.pipe(res);
        }

        // No result, create write stream, then resize the image, and cache it
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        const cacheWritePath = path.join(cacheDir, `${cachedThumbnailKey}.jpg`);

        verbose && console.log('Reading file and creating cache for ', cachedThumbnailKey, filePath);

        sharp(filePath)
            .resize(width, height, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 60 })
            .toBuffer()
            .then(function (buf) {
                return fs.promises.writeFile(cacheWritePath, buf).then(function () {
                    return buf;
                });
            })
            .then(function (buf) {
                cache.put(cachedThumbnailKey, cacheWritePath);
                res.setHeader('Content-Type', 'image/jpeg');
                res.send(buf);
            })
            .catch(function (err) {
                verbose && console.log('Sharp thumbnail error', err);
                return common.error(req, res, next, 500, 'Error generating thumbnail', err);
            });
    };
};
