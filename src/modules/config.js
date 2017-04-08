// Discord Bot API
import events from './events';

// Other
import chalk from 'chalk';
import CSON from 'cson';
import fs from 'fs';


let config = {}; // The config.cson will be stored in this object
let reloadConfig = null;


// Save the new config
function save(callback) {
    const csonString = CSON.createCSONString(config);

    fs.writeFile('./config.cson', csonString, (error) => {
        if (error) {
            console.log(chalk.red(error));
            console.log(''); // Empty line
            callback(error);
            return false;
        }

        callback();
    });
}


function get() {
    if (!config.globalCommandPrefix || config.globalCommandPrefix.trim() === '') config.globalCommandPrefix = '!';
    return config;
}


function enablePlugin(name, callback) {
    config.plugins[name] = {};
    save((error) => {
        if (error) {
            callback(error);
            return false;
        }

        callback();
        return true;
    });
}


function rename(name, callback) {
    config.credentials.name = name;

    save((error) => {
        if (error) {
            callback(error);
            return false;
        }

        callback();
        return true;
    });
}


function op(userID, permissions, callback) {
    if (Object.prototype.hasOwnProperty.call(!config, 'operators')) config.operators = {};

    if (Object.prototype.hasOwnProperty.call(!config.operators, userID)) {
        config.operators[userID] = {
            permissions: [],
        };
    }

    if (Object.prototype.hasOwnProperty.call(!config.operators[userID], 'permissions')) config.operators[userID].permissions = [];

    for (const permission of permissions) {
        if (config.operators[userID].permissions.indexOf(permission) < 0) config.operators[userID].permissions.push(permission);
    }

    save((error) => {
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

    if (config.operators[userID].permissions.length === 0) delete config.operators[userID].permissions;

    save((error) => {
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

    save((error) => {
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

    save((error) => {
        if (error) {
            callback(error);
            return false;
        }

        callback();
        return true;
    });
}


function avatar(path, callback) {
    config.credentials.avatar = path === 'null' ? null : path;

    save((error) => {
        if (error) {
            callback(error);
            return false;
        }

        callback();
        return true;
    });
}


function reload(callback) {
    config = CSON.load('./config.cson'); // Load the config from the config.cson
    events.emit('config reloaded');
    automaticReload(); // eslint-disable-line no-use-before-define
    if (callback) callback();
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

    if (Math.ceil(config.reloadConfig) === 0) return false;

    if (isNaN(config.reloadConfig)) {
        console.log(chalk.red('The reload time of the config defined in your "config.cson" is invalid. Therefore it defaults to 5 seconds.'));
        return false;
    }

    reloadConfig = setInterval(() => {
        reload();
    }, Math.ceil(config.reloadConfig) * 1000);
}


if (!config.credentials) {
    throw new Error('You have to set the credentials in your config.cson.');
}

if (!config.credentials.token) {
    throw new Error('You have to set the token in your config.cson.');
}

if (!config.serverID) {
    throw new Error('You have to set the server id in your config.cson so that the bot will listen only on one server.');
}

if (!config.plugins || Object.keys(config.plugins).length < 1) {
    console.log(chalk.red('There are no plugins enabled in your config.cson.'));
    console.log(''); // Empty line
}

if (!config.ownerID) {
    console.log(chalk.red('You should set an owner id in your config.cson to give you the full control over the bot.'));
    console.log(''); // Empty line
}


const configModule = {
    save,
    get,
    enablePlugin,
    rename,
    op,
    deop,
    prefix,
    owner,
    reload,
    avatar,
};

export default configModule;
