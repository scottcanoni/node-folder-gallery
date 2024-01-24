module.exports = function (config) {
    if (!config) {
        throw new Error('No config specified');
    }

    if (!config.staticFiles || !config.urlRoot) {
        throw new Error('Both staticFiles and urlRoot must be specified');
    }

    const common = require('./common')(config);

    config.staticFiles = common.friendlyPath(config.staticFiles);
    config.urlRoot = common.friendlyPath(config.urlRoot);
    config.cacheDir = config.cacheDir || './cache';
    config.render = config.render || false;
    config.verbose = config.verbose || false;
    config.thumbnail = config.thumbnail || {};
    config.thumbnail.width = config.thumbnail.width || 300;
    config.thumbnail.height = config.thumbnail.height || 200;

    config.verbose && console.log('node-folder-gallery middleware connected, using config:', config);

    return require('./middleware')(config);
};
