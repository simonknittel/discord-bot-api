// Discord Bot API
import configModule from './config';


const plugins = {};


function enablePlugin(name, callback) {
    if (Object.prototype.hasOwnProperty.call(plugins, name)) {
        callback('already enabled');
        return true;
    }

    try {
        const plugin = require('../plugins/' + name);
        plugins[name] = plugin.default;

        if (Object.prototype.hasOwnProperty.call(configModule.get().plugins, name)) {
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


// Plugins
for (const pluginName in configModule.get().plugins) {
    if (Object.prototype.hasOwnProperty.call(configModule.get().plugins, pluginName)) {
        const plugin = require('../plugins/' + pluginName);
        plugins[pluginName] = plugin.default;
    }
}


export {
    plugins,
    enablePlugin,
};
