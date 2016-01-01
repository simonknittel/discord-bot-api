// Discord Bot API
import * as helpers from './helpers';

// Other
import chalk from 'chalk';
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

if (!config.credentials) {
    console.log(chalk.red('You have to set the credentials in your config.json.'));
    console.log(''); // Empty line
    process.exit();
}

if (!config.credentials.email) {
    console.log(chalk.red('You have to set the email in your config.json.'));
    console.log(''); // Empty line
    process.exit();
}

if (!config.credentials.password) {
    console.log(chalk.red('You have to set the password in your config.json.'));
    console.log(''); // Empty line
    process.exit();
}

if (!config.serverID) {
    console.log(chalk.red('You have to set the server id in your config.json so that the bot will listen only on one server.'));
    console.log(''); // Empty line
    process.exit();
}

if (!config.plugins || Object.keys(config.plugins).length < 1) {
    console.log(chalk.red('There are no plugins enabled in your config.json.'));
    console.log(''); // Empty line
}

if (!config.ownerID) {
    console.log(chalk.red('You should set an owner id in your config.json to give you the full control over the bot.'));
    console.log(''); // Empty line
}

let configModule = {
    save,
    get,
};

export default configModule; // Make the config available for everyone
