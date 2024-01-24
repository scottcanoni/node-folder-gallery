const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cache = require('memory-cache');
const im = require('imagemagick-stream');

module.exports = function (config) {
    const common = require('./common')(config);
    const { staticFiles, cacheDir, verbose } = config;

    return (req, res, next) => {
        let filePath;
        if (req.albumThumbnail) {
            filePath = req.albumThumbnail;
        }
        else {
            filePath = decodeURIComponent(path.join(staticFiles, req.path));
        }

        fs.stat(filePath, function (err) {
            if (err) {
                return common.error(req, res, next, 404, 'File not found', err);
            }
            const fstream = fs.createReadStream(filePath);
            fstream.on('error', function (err) {
                return common.error(req, res, next, 404, 'File not found', err);
            });

            // Resize the file and then stream the results to cache and back to the user
            const dimensions = `${config.thumbnail.width}x${config.thumbnail.height}`;
            const cachedThumbnailUniqueTraits = filePath + dimensions + req.albumThumbnail;
            const cachedThumbnailKey = crypto.createHash('md5').update(cachedThumbnailUniqueTraits).digest('hex');

            // Check the cache for a previously resized thumbnail of matching file path and dimensions
            const cachedResult = cache.get(cachedThumbnailKey);

            // TODO: eventually should just try the fs.read on cachedResult, existsSync is a bad hack
            if (cachedResult && fs.existsSync(cachedResult)) {
                verbose && console.log('Returning cache for ', filePath);
                // cache hit - read & return
                const cacheReadStream = fs.createReadStream(cachedResult);
                cacheReadStream.on('error', function () {
                    return common.error(req, res, next, 404, 'File not found', err);
                });
                return cacheReadStream.pipe(res);
            }

            // No result, create write stream, then resize the image, and cache it
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }
            const cacheWritePath = path.join(cacheDir, `${cachedThumbnailKey}.jpg`);
            const cacheWriteStream = fs.createWriteStream(cacheWritePath);

            const resizer = im().resize(dimensions).quality(60);
            resizer.on('error', function (err) {
                return common.error(req, res, next, 500, 'Error in IM/GM converting file', err);
            });

            const resizeStream = fstream.pipe(resizer);

            // Pipe to our tmp cache file, so we can use this in future
            resizeStream.pipe(cacheWriteStream);
            cache.put(cachedThumbnailKey, cacheWritePath);

            // Also stream the resized result back as the response
            cacheWriteStream.on('error', function () {
                verbose && console.log('cacheWriteStream ERROR for ', filePath);
                return common.error(req, res, next, 500, 'cacheWriteStream ERROR', err);
            });
            cacheWriteStream.on('finish', function () {
                verbose && console.log('cacheWriteStream finished for ', filePath);

            });

            return resizeStream.pipe(res);
        });
    };
};
