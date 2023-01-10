module.exports = function (config) {
    if (!config) {
        throw new Error('No config specified');
    }

    if (!config.staticFiles || !config.urlRoot) {
        throw new Error('Both staticFiles and urlRoot must be specified');
    }

    const common = require('./common')(config);

    // Remove any potential trailing or leading / from our paths
    config.staticFiles = common.friendlyPath(config.staticFiles);
    config.urlRoot = common.friendlyPath(config.urlRoot);
    config.cacheDir = config.cacheDir || './cache';

    console.log('node-folder-gallery middleware connected, using config:', config);

    return require('./middleware')(config);
};
