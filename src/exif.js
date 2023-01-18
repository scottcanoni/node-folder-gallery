const { ExifImage } = require('exif');

const careAbout = {
    'fileName': 'File Name',
    'Artist': 'Artist',
    'Copyright': 'Copyright',
    'DateTimeOriginal': 'Date / Time',
    'Make': 'Make',
    'Model': 'Model',
    'LensModel': 'Lens Model',
    'ExifImageWidth': 'Width',
    'ExifImageHeight': 'Height',
    'ExposureTime': 'Shutter Speed',
    'ISO': 'ISO',
    'FocalLength': 'Focal Length',
    'ApertureValue': 'Aperture',
    'GPSLatitude': 'Lat',
    'GPSLongitude': 'Long',
    'Flash': 'Flash',
    'FNumber': 'FNumber',
    'Orientation': 'Orientation',
    'ImageDescription': 'Description',
};

function sortObject(obj, providedOrder) {
    const objKeys = Object.keys(providedOrder);

    const sortedObj = {};

    for (const objKey of objKeys) {
        const value = obj[providedOrder[objKey]];

        if (typeof (value) !== 'undefined') {
            sortedObj[providedOrder[objKey]] = value;
        }
    }

    return sortedObj;
}

/*
 * Utility function to convert exif data into something more consumable by a template
 */
const exif = function (staticPath, callback) {
    try {
        new ExifImage({ image: staticPath }, function (error, data) {
            if (error) {
                return callback(error);
            }
            else {
                const exifMap = {};
                const image = data.image;
                const exif = data.exif;
                const gps = data.gps;
                const dataPoints = {
                    ...image,
                    ...exif,
                    ...gps,
                };

                for (const key of Object.keys(dataPoints)) {
                    if (careAbout[key]) {
                        let dataPoint = dataPoints[key];

                        if (careAbout[key] === 'Shutter Speed') {
                            // exifMap['Shutter Speed Decimal'] = dataPoint;
                            // Transform shutter speed to a fraction
                            dataPoint = dec2frac(dataPoint);
                        }

                        if (typeof dataPoint == 'number') {
                            dataPoint = Math.round(dataPoint * 100) / 100; // no long decimals
                        }

                        exifMap[careAbout[key]] = dataPoint;
                    }
                }

                const sortedExifData = sortObject(exifMap, careAbout);

                return callback(null, sortedExifData);
            }
        });
    }
    catch (error) {
        return callback(error);
    }
};

// source: http://stackoverflow.com/questions/95727/how-to-convert-floats-to-human-readable-fractions
function dec2frac(d) {
    let df = 1;
    let top = 1;
    let bot = 1;

    while (df !== d) {
        if (df < d) {
            top += 1;
        }
        else {
            bot += 1;
            top = parseInt(d * bot);
        }
        df = top / bot;
    }
    return top + '/' + bot;
}

module.exports = exif;
