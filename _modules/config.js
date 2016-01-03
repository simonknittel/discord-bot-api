// Other
import chalk from 'chalk';
import jsonfile from 'jsonfile';

let config = {}; // The config.json will be stored in this object

// Save the new config
function save(callback) {
    jsonfile.writeFile('./config.json', config, {spaces: 4}, (error) => {
        if (error) {
            console.log(chalk.red(error));
            console.log(''); // Empty line
            callback(error);
        }

        callback();
    });
}

function get() {
    return config;
}

function enablePlugin(name, callback) {
    config.plugins[name] = {};
    save(null, callback);
}

function rename(name, callback) {
    config.credentials.name = name;

    save(error => {
        if (error) {
            callback(error);
            return false;
        }

        callback();
        return true;
    });
}

function op(userID, permission, callback) {
    if (!config.hasOwnProperty('operators')) {
        config.operators = {};
    }

    if (!config.operators.hasOwnProperty(userID)) {
        config.operators[userID] = {
            permissions: [],
        };
    }

    if (config.operators[userID].permissions.indexOf(permission) < 0) {
        config.operators[userID].permissions.push(permission);
    }

    save(error => {
        if (error) {
            callback(error);
            return false;
        }

        callback();
        return true;
    });
}

function deop(userID, permission, callback) {
    if (
        !config.operators
        || !config.operators[userID]
        || !config.operators[userID].permissions
        || config.operators[userID].permissions.indexOf(permission) < 0
    ) {
        callback('no such permission');
        return false;
    }

    config.operators[userID].permissions.splice(config.operators[userID].permissions.indexOf(permission), 1);

    save(error => {
        if (error) {
            callback(error);
            return false;
        }

        callback();
        return true;
    });
}

function prefix(newPrefix, callback) {
    config.globalCommandPrefix = newPrefix;

    save(error => {
        if (error) {
            callback(error);
            return false;
        }

        callback();
        return true;
    });
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
    enablePlugin,
    rename,
    op,
    deop,
    prefix,
};

export default configModule; // Make the config available for everyone
