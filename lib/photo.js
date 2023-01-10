const fs = require('fs');
const path = require('path');
const exif = require('./exif');
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
            if (err || !files.length) {
                return common.error(req, res, next, 404, 'Photo not found', err);
            }
            const fileIndex = files.findIndex((file) => file.indexOf(photoName) > -1);
            if (fileIndex === -1) {
                return common.error(req, res, next, 404, 'Photo not found', {});
            }

            const fileName = files[fileIndex];
            photoWebPath = path.join(config.urlRoot, albumPath, fileName);
            photoFileSystemPath = path.join(albumFilesystemPath, fileName);

            const cleanedPhotoWebPath = photoWebPath.replace(/#/g, '%23');
            const breadcrumbs = common.breadcrumb(common.friendlyPath(photoBreadcrumbPath));
            const friendlyPrefix = breadcrumbs.length < 3 ? config.title : breadcrumbs[breadcrumbs.length - 2].name;

            exif(photoFileSystemPath, function (exifErr, exifInfo) {
                req.tpl = 'photo.ejs';
                req.data = {
                    ...config,
                    name: photoName,
                    friendlyName: `${friendlyPrefix} #${fileIndex + 1}`,
                    fileName,
                    breadcrumb: breadcrumbs,
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
