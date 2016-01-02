// Discord Bot API
import configModule from './config';

let plugins = {};

function enablePlugin(name, callback) {
    if (plugins.hasOwnProperty(name)) {
        callback('already enabled');
        return true;
    }

    try {
        const plugin = require('../_plugins/' + name);
        plugins[name] = plugin.default;

        if (configModule.get().plugins.hasOwnProperty(name)) {
            callback();
        } else {
            configModule.enablePlugin(name, () => {
                callback();
            });
        }
    } catch (e) {
        callback('failed to load');
    }
}

plugins.enablePlugin = enablePlugin;

// Plugins
for (let pluginName in configModule.get().plugins) {
    if (configModule.get().plugins.hasOwnProperty(pluginName)) {
        const plugin = require('../_plugins/' + pluginName);
        plugins[pluginName] = plugin.default;
    }
}

export default plugins;
