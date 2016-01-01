// Discord Bot API
import configModule from './config';

let plugins = {};

// Plugins
for (let pluginName in configModule.get().plugins) {
    if (configModule.get().plugins.hasOwnProperty(pluginName)) {
        let plugin = require('../_plugins/' + pluginName);
        plugins[pluginName] = plugin.default;
    }
}

export default plugins;
