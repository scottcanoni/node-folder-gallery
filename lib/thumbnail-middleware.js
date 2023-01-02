const path = require('path')
const fs = require('fs');
const crypto = require('crypto');
const cache = require('memory-cache');
const im = require('imagemagick-stream');

module.exports = function (config) {
    const common = require('./common')(config);
    const staticFiles = config.staticFiles;

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

            // streaming resize our file
            const w = (config.thumbnail && config.thumbnail.width) || 150;
            const h = (config.thumbnail && config.thumbnail.height) || 150;
            const dimensions = w + 'x' + h;

            let cachedResizedKey = filePath + dimensions + req.albumThumbnail;
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
    };
};
