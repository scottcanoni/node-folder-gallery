const path = require('path');
const exifr = require('exifr');

/** Display order and labels for the photo template (matches `careAbout` key → label). */
const careAbout = {
    fileName: 'File Name',
    Artist: 'Artist',
    Copyright: 'Copyright',
    DateTimeOriginal: 'Date / Time',
    Make: 'Make',
    Model: 'Model',
    LensModel: 'Lens Model',
    ExifImageWidth: 'Width',
    ExifImageHeight: 'Height',
    ExposureTime: 'Shutter Speed',
    ISO: 'ISO',
    FocalLength: 'Focal Length',
    ApertureValue: 'Aperture',
    GPSLatitude: 'Lat',
    GPSLongitude: 'Long',
    Flash: 'Flash',
    FNumber: 'FNumber',
    Orientation: 'Orientation',
    ImageDescription: 'Description',
};

function sortObject(obj, orderMap) {
    const sorted = {};
    for (const key of Object.keys(orderMap)) {
        const label = orderMap[key];
        if (typeof obj[label] !== 'undefined') {
            sorted[label] = obj[label];
        }
    }
    return sorted;
}

function pick(tags, ...keys) {
    for (const k of keys) {
        const v = tags[k];
        if (v !== undefined && v !== null && v !== '') {
            return v;
        }
    }
    return undefined;
}

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
            top = parseInt(d * bot, 10);
        }
        df = top / bot;
    }
    return `${top}/${bot}`;
}

const round2 = (n) => (typeof n === 'number' ? Math.round(n * 100) / 100 : n);
const round5 = (n) => (typeof n === 'number' ? Math.round(n * 100000) / 100000 : n);

/**
 * Each row: `careAbout` id, optional `pick` key list for exifr, optional `transform(raw)`.
 * `fileName` uses `fromPath` instead of `pick`.
 */
const fields = [
    { id: 'fileName', fromPath: (p) => path.basename(p) },
    { id: 'Artist', pick: ['Artist', 'artist'] },
    { id: 'Copyright', pick: ['Copyright', 'copyright'] },
    {
        id: 'DateTimeOriginal',
        pick: ['DateTimeOriginal', 'CreateDate', 'DateTime', 'dateTimeOriginal'],
        transform: (v) => (v instanceof Date ? v.toISOString() : v),
    },
    { id: 'Make', pick: ['Make', 'make'] },
    { id: 'Model', pick: ['Model', 'model'] },
    { id: 'LensModel', pick: ['LensModel', 'Lens', 'lensModel'] },
    { id: 'ExifImageWidth', pick: ['ExifImageWidth', 'ImageWidth', 'PixelXDimension', 'exifImageWidth'] },
    { id: 'ExifImageHeight', pick: ['ExifImageHeight', 'ImageHeight', 'PixelYDimension', 'exifImageHeight'] },
    {
        id: 'ExposureTime',
        pick: ['ExposureTime', 'exposureTime'],
        transform: (v) => (typeof v === 'number' ? dec2frac(v) : v),
    },
    {
        id: 'ISO',
        pick: ['ISO', 'ISOSpeedRatings', 'iso'],
        transform: (v) => {
            const x = Array.isArray(v) ? v[0] : v;
            return round2(x);
        },
    },
    { id: 'FocalLength', pick: ['FocalLength', 'focalLength'], transform: round2 },
    { id: 'ApertureValue', pick: ['ApertureValue', 'apertureValue'], transform: round2 },
    { id: 'FNumber', pick: ['FNumber', 'fNumber'], transform: round2 },
    { id: 'GPSLatitude', pick: ['latitude', 'GPSLatitude'], transform: round5 },
    { id: 'GPSLongitude', pick: ['longitude', 'GPSLongitude'], transform: round5 },
    { id: 'Flash', pick: ['Flash', 'flash'] },
    { id: 'Orientation', pick: ['Orientation', 'orientation'] },
    { id: 'ImageDescription', pick: ['ImageDescription', 'imageDescription', 'Caption', 'caption'] },
];

function buildExifMap(tags, staticPath) {
    const exifMap = {};
    for (const f of fields) {
        const label = careAbout[f.id];
        let v;
        if (f.fromPath) {
            v = f.fromPath(staticPath);
        }
        else {
            v = pick(tags, ...f.pick);
            if (v === undefined) {
                continue;
            }
            if (f.transform) {
                v = f.transform(v);
            }
        }
        exifMap[label] = v;
    }
    return exifMap;
}

const exif = function (staticPath, callback) {
    exifr
        .parse(staticPath, {
            mergeOutput: true,
            exif: true,
            gps: true,
            iptc: true,
            ifd0: true,
            reviveValues: true,
        })
        .then(function (tags) {
            if (!tags || typeof tags !== 'object') {
                return callback(null, {});
            }
            return callback(null, sortObject(buildExifMap(tags, staticPath), careAbout));
        })
        .catch(function (error) {
            return callback(error);
        });
};

module.exports = exif;
