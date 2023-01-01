const fs = require('fs');
const path = require('path');
const _ = require('underscore');
const exif = require('./exif')
let common;

module.exports = function (config) {
    common = require('./common')(config);
    return function (req, res, next) {
        const albumPath = req.params[0] || ''; // This CAN be undefined, if a photo exists at root
        const photoName = req.params[1] || '';
        const photoBreadcrumbPath = path.join(albumPath, photoName); // Path for breadcrumb mostly
        const albumFilesystemPath = './' + path.join(config.staticFiles, albumPath);
        let photoFileSystemPath;
        let photoWebPath;

        fs.readdir(albumFilesystemPath, function (err, files) {
            if (err || _.isEmpty(files)) {
                return common.error(req, res, next, 404, 'Photo not found', err);
            }
            const file = _.find(files, function (file) {
                return file.indexOf(photoName) > -1;
            });
            if (!file) {
                return common.error(req, res, next, 404, 'Photo not found', {});
            }
            // Include the /gallery/ or whatever
            photoWebPath = path.join(config.urlRoot, albumPath, file);
            photoFileSystemPath = path.join(albumFilesystemPath, file);

            const cleanedPhotoWebPath = photoWebPath.replace(/#/g, '%23');

            exif(photoFileSystemPath, function (exifErr, exifInfo) {
                req.tpl = 'photo.ejs';
                req.data = {
                    ...config,
                    name: photoName,
                    breadcrumb: common.breadcrumb(common.friendlyPath(photoBreadcrumbPath)),
                    src: cleanedPhotoWebPath,
                    srcUnEncoded: photoWebPath,
                    path: photoBreadcrumbPath,
                    exif: exifErr ? {} : exifInfo,
                };

                return next();
            });
        });

    };
};
