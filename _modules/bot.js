import config from '../config';
import packageJSON from '../package';
import DiscordClient from 'discord.io';
import chalk from 'chalk';

// Set a default global command prefix
if (!config.globalCommandPrefix) {
    config.globalCommandPrefix = '!';
}

// Start the discord instance
let bot = new DiscordClient({
    email: config.credentials.email,
    password: config.credentials.password,
    autorun: true,
});

// All commands will be stored in this object.
// The keywords will be set as the keys so there will be no duplicates.
let commands = {};

// All API endpoints will be stored in this object.
let api = {};

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

api.isOperator = (userID, requestedPermission) => {
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

    return false;
};

// Rename the bot
function setName(bot, name) {
    bot.editUserInfo({
        password: config.credentials.password,
        username: name,
    });

    // Save the new name to the config.json
}

let commandHistory = {};

// Handle incomming message
function handleMessage(user, userID, channelID, message, rawEvent) {
    // Check if the global command prefix is on the first position of the message
    if (message.indexOf(config.globalCommandPrefix) !== 0) {
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

    // Remove the global command prefix from the message
    message = message.substring(config.globalCommandPrefix.length);
    // There is no requested command
    if (message.length < 1) {
        return false;
    }

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

function renameCommand(user, userID, channelID, message) {
    if (!api.isOperator(userID, 'general:rename')) {
        return false;
    }

    setName(bot, message);
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

// Discord instance is ready
bot.on('ready', () => {
    console.log(chalk.green('Discord Bot API started.'));

    if (config.credentials.name) {
        setName(bot, config.credentials.name); // Set the name of the bot to the one defined in the config.json
    }
});

// Trigger on incomming message
bot.on('message', handleMessage);

// General commands
let general = api.registerPlugin();

general.addCommand('about', aboutCommand, 'Shows a short description of the bot');
general.addCommand('commands', commandsCommand, 'Shows all available commands');
general.addCommand('rename', renameCommand, 'Renames the bot (Example: `' + general.prefix + 'rename My Bot`)');
general.addCommand('kill', killCommand, 'Stops the bot');
general.addCommand('userid', userIDCommand, 'Returns the ID of the user');

// Make the discord instance and API endpoints available for plugins
export {bot, api};
