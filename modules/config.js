// Discord Bot API
import events from './events';

// Other
import chalk from 'chalk';
import jsonfile from 'jsonfile';

let config = {}; // The config.json will be stored in this object
let reloadConfig = null;

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

function op(userID, permissions, callback) {
    if (!config.hasOwnProperty('operators')) {
        config.operators = {};
    }

    if (!config.operators.hasOwnProperty(userID)) {
        config.operators[userID] = {
            permissions: [],
        };
    }

    if (!config.operators[userID].hasOwnProperty('permissions')) {
        config.operators[userID].permissions = [];
    }

    for (const permission of permissions) {
        if (config.operators[userID].permissions.indexOf(permission) < 0) {
            config.operators[userID].permissions.push(permission);
        }
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

function deop(userID, permissions, callback) {
    for (const permission of permissions) {
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
    }

    if (config.operators[userID].permissions.length === 0) {
        delete config.operators[userID].permissions;
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

function owner(newOwner, callback) {
    config.ownerID = newOwner;

    save(error => {
        if (error) {
            callback(error);
            return false;
        }

        callback();
        return true;
    });
}

function reload(callback) {
    config = jsonfile.readFileSync('./config.json'); // Load the config from the config.json
    events.emit('config reloaded');
    automaticReload();
    if (callback) {
        callback();
    }
}
reload();

function automaticReload() {
    clearInterval(reloadConfig);

    if (!config.reloadConfig && config.reloadConfig !== 0) {
        reloadConfig = setInterval(() => {
            reload();
        }, 5000);
        return true;
    }

    if (Math.ceil(config.reloadConfig) === 0) {
        return false;
    }

    if (isNaN(config.reloadConfig)) {
        console.log(chalk.red('The reload time of the config defined in your "config.json" is invalid. Therefore it defaults to 5 seconds.'));
        return false;
    }

    reloadConfig = setInterval(() => {
        reload();
    }, Math.ceil(config.reloadConfig) * 1000);
}

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
    owner,
    reload,
};

export default configModule; // Make the config available for everyone
