import packageJSON from '../package';
import DiscordClient from 'discord.io';
import chalk from 'chalk';
import jsonfile from 'jsonfile';

let config = {}; // The config.json will be stored in this object
let bot = null; // The Discord instance will be stored in this object
let commandHistory = {};
let api = {}; // All API endpoints will be stored in this object.
let commands = {}; // All commands will be stored in this object.

api.registerPlugin = function(name = null, defaultCommandPrefix = '') {
    const pluginCommandPrefix = name && config.plugins && config.plugins[name] && config.plugins[name].commandPrefix ? config.plugins[name].commandPrefix : defaultCommandPrefix;

    return {
        // API endpoint through which the plugin can add custom commands
        addCommand: (command, fn, description = '') => {
            commands[pluginCommandPrefix + (pluginCommandPrefix.length > 0 ? ' ' : '') + command] = {
                description,
                fn,
            };
        },
        prefix: config.globalCommandPrefix + pluginCommandPrefix + (pluginCommandPrefix.length > 0 ? ' ' : ''),
    };
};

let general = api.registerPlugin();

api.isOperator = (userID, requestedPermission) => {
    // The owner has every permission
    if (userID === config.ownerID) {
        return true;
    }

    if (config.operators.length > 0) {
        for (const operator of config.operators) {
            if (operator.id === userID) {
                for (const permission of operator.permissions) {
                    return permission === requestedPermission;
                }
            }
        }
    }

    bot.sendMessage({
        to: channelID,
        message: 'You do not have the permission to run this command.',
    });

    // The user does not have the permission
    return false;
};

// Handle incomming message
function handleMessage(user, userID, channelID, message, rawEvent) {
    if (config.mentionRequired) {
        // Check if the bot got mentioned
        if (message.indexOf('<@' + bot.id + '>') !== 0) {
            return false;
        }

        // Remove the mention from the message
        message = message.substring(('<@' + bot.id + '>').length);
        message = message.trim();
    }

    // Check if the global command prefix is on the first position of the message
    if (message.indexOf(config.globalCommandPrefix) !== 0) {
        return false;
    }

    // Remove the global command prefix from the message
    message = message.substring(config.globalCommandPrefix.length);

    // There is no requested command
    if (message.length < 1) {
        return false;
    }

    // Check if the cooldown of the user is already expired
    if (config.commandCooldown && commandHistory[userID]) {
        console.log(commandHistory[userID]);
        const timeDifference = new Date().getTime() - commandHistory[userID].getTime();
        console.log(timeDifference);
        // The cooldown is not yet expired
        if (timeDifference < config.commandCooldown) {
            return false;
        }
    }
    commandHistory[userID] = new Date();

    // Look for the requested command
    let requestedCommand = null;
    Object.keys(commands).forEach(command => {
        if (message.indexOf(command) === 0) {
            requestedCommand = command;
        }
    });

    // The requested command could not be found
    if (!requestedCommand) {
        return false;
    }

    // Remove the requested command from the message
    message = message.substring(requestedCommand.length).trim();

    // Execute the command
    commands[requestedCommand].fn(user, userID, channelID, message, rawEvent);
}

function aboutCommand(user, userID, channelID) {
    bot.sendMessage({
        to: channelID,
        message: 'Hey there, my name is the `Discord Bot API`. I\'m made by Simon Knittel (<hallo@simonknittel.de>) and based on the Node.js library called discord.io (<https://github.com/izy521/discord.io>). My main feature is to offer a API for plugins that can be used with me. Visit <' + packageJSON.homepage + '> for more information. If you find bugs or have other issues please report them here <' + packageJSON.bugs.url + '>',
    });
}

function commandsCommand(user, userID, channelID) {
    let string = '';
    Object.keys(commands).forEach(command => {
        string += '`' + config.globalCommandPrefix + command + '`' + (commands[command].description.length > 0 ? ' - ' + commands[command].description : '') + '\n';
    });

    bot.sendMessage({
        to: channelID,
        message: string,
    });
}

// http://stackoverflow.com/a/171256/3942401
function mergeObjects(obj1, obj2) {
    let obj3 = {};

    for (const attr in obj1) { obj3[attr] = obj1[attr]; }
    for (const attr in obj2) { obj3[attr] = obj2[attr]; }

    return obj3;
}

function configCommand(user, userID, channelID, message) {
    if (!api.isOperator(userID, 'general:config')) {
        return false;
    }

    message = message.split(' ');

    // Check if a property and a new value is present
    if (message.length < 2) {
        bot.sendMessage({
            to: channelID,
            message: 'Example use of this command: `' + general.prefix + 'config credentials.name The Best Bot`',
        });

        return false;
    }

    let changingProperty = message[0].split('.');
    message.shift(); // Remove the property from the message
    let newValue = message.join(' ');
    if (newValue === 'true') { // Make a boolean to a true boolean type
        newValue = true;
    } else if (newValue === 'false') { // Make a boolean to a true boolean type
        newValue = false;
    } else if (isNaN(newValue)) { // Make a number to a true number type
        newValue = newValue;
    } else {
        newValue = Number(newValue);
    }

    // Create a object
    let newConfig = {};
    for (let i = changingProperty.length - 1; i >= 0; i--) {
        if (i === changingProperty.length - 1) {
            newConfig[changingProperty[i]] = newValue;
        } else {
            let lastSegment = JSON.parse(JSON.stringify(newConfig));
            newConfig = {};
            newConfig[changingProperty[i]] = lastSegment;
        }
    }

    // Merge the old config with the new one
    config = mergeObjects(config, newConfig);

    // Save the new config
    jsonfile.writeFile('./config.json', config, {spaces: 4}, error => {
        if (error) {
            console.error(error);
            bot.sendMessage({
                to: channelID,
                message: 'There was a problem with saving the new config.',
            });

            return false;
        }

        bot.sendMessage({
            to: channelID,
            message: 'The new config got successfully saved.',
        });
    });
}

// Stops the bot
function killCommand(user, userID) {
    if (!api.isOperator(userID, 'general:kill')) {
        return false;
    }

    console.log('The Discord Bot API got stopped through the kill command.');
    process.exit();
}

function userIDCommand(user, userID, channelID) {
    bot.sendMessage({
        to: channelID,
        message: 'Your ID:' + userID,
    });
}

// Rename the bot
function setName(name) {
    bot.editUserInfo({
        password: config.credentials.password,
        username: name,
    });
}

// Load config and initialize the bot
jsonfile.readFile('./config.json', (error, json) => {
    if (error) {
        console.error(error);
    }

    config = json;

    // Set a default global command prefix
    if (!config.globalCommandPrefix) {
        config.globalCommandPrefix = '!';
    }

    // Start the discord instance
    bot = new DiscordClient({
        email: config.credentials.email,
        password: config.credentials.password,
        autorun: true,
    });

    // Discord instance is ready
    bot.on('ready', () => {
        console.log(chalk.green('Discord Bot API started.'));

        if (config.credentials.name) {
            setName(config.credentials.name); // Set the name of the bot to the one defined in the config.json
        }
    });

    // Trigger on incomming message
    bot.on('message', handleMessage);

    // General commands
    general.addCommand('about', aboutCommand, 'Shows a short description of the bot');
    general.addCommand('commands', commandsCommand, 'Shows all available commands');
    general.addCommand('config', configCommand, 'Change the config until the next restart (Example: `' + general.prefix + 'credentials.name The Best Bot`)');
    general.addCommand('kill', killCommand, 'Stops the bot');
    general.addCommand('userid', userIDCommand, 'Returns the ID of the user');
});

// Make the discord instance, API endpoints and config available for plugins
export {bot, api, config};
