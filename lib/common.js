const _ = require('underscore');
const path = require('path');
const ejs = require('ejs');
const fs = require('fs');
let config;

module.exports = function (cfg) {
    config = cfg;
    return common;
};

const common = {};

common.breadcrumb = function (pathStr) {
    let paths;
    // TODO: Use path.separator instead?
    if (pathStr.indexOf('\\') !== -1) {
        paths = pathStr.split('\\');
    }
    else {
        paths = pathStr.split('/');
    }
    let breadcrumbs = [{
        name: config.title || 'Gallery',
        url: config.urlRoot,
    }];
    let joined = '';
    const subDirectories = paths.filter((pathSeg) => pathSeg !== '').map((pathSeg) => {
        joined = path.join(joined, pathSeg).replace(/#/g, '%23');
        return {
            name: pathSeg,
            url: path.join(config.urlRoot, joined),
        };
    });

    breadcrumbs = breadcrumbs.concat(subDirectories);
    return breadcrumbs;
};

common.friendlyPath = function (unfriendlyPath) {
    return decodeURIComponent(unfriendlyPath).replace(/^\//, '').replace(/\/$/, '');
};

common.error = function (req, res, next, status, message, errorObject) {
    if (config.render === false) {
        return next(JSON.stringify({ message: message, error: errorObject }));
    }

    return res.status(404).json({ message: message, error: errorObject });
};

common.render = function (req, res, next) {
    const data = req.data;
    const tpl = req.tpl;
    if (config.render === false) {
        // only return compiled template file
        return fs.readFile(path.join(__dirname, '..', 'views', tpl), function (err, tplContents) {
            if (err) {
                return next(err);
            }
            try {
                req.html = ejs.render(tplContents.toString(), data);
            }
            catch (err) {
                return next(err);
            }
            return next();
        });
    }

    if (req.accepts('html')) {
        return res.render(tpl, data);
    }
    else {
        return res.json(data);
    }
};
