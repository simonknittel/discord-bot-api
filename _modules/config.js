// Discord Bot API
import * as helpers from './helpers';

// Other
import jsonfile from 'jsonfile';

let config = {}; // The config.json will be stored in this object

// Save the new config
function save(newConfig, callback) {
    config = helpers.mergeObjects(config, newConfig);

    jsonfile.writeFile('./config.json', config, {spaces: 4}, callback);
}

function get() {
    return config;
}

config = jsonfile.readFileSync('./config.json'); // Load the config from the config.json

if (!config.globalCommandPrefix) {
    config.globalCommandPrefix = '!';
}

let configModule = {
    save,
    get,
};

export default configModule; // Make the config available for everyone
