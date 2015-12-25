import config from '../config';
import packageJSON from '../package';
import DiscordClient from 'discord.io';
import chalk from 'chalk';

// Set a default global command prefix
if (!config.commandPrefix) {
    config.commandPrefix = '!';
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

// API endpoint through which the plugin can add commands
api.addCommand = (command, fn, description = '') => {
    commands[command] = {
        description,
        fn,
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

// Handle incomming message
function handleMessage(user, userID, channelID, message, rawEvent) {
    // Check if the global command prefix is on the first position of the message
    if (message.indexOf(config.commandPrefix) !== 0) {
        return false;
    }

    // Get the command keyword without the global command prefix
    const requestedCommand = message.split(' ')[0].substring(config.commandPrefix.length);
    if (requestedCommand.length < 1) {
        return false;
    }

    // Let only the owner control the whole bot
    // if (userID !== config.ownerID) {
    //     return false;
    // }

    // Check if the requested command is available
    if (!commands[requestedCommand]) {
        return false;
    }

    // Execute the command
    commands[requestedCommand].fn(user, userID, channelID, message.substring(message.split(' ')[0].length).trim(), rawEvent);
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
        string += '`' + config.commandPrefix + command + '`' + (commands[command].description.length > 0 ? ' - ' + commands[command].description : '') + '\n';
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
api.addCommand('about', aboutCommand, 'Shows a short description of the bot');
api.addCommand('commands', commandsCommand, 'Shows all available commands');
api.addCommand('rename', renameCommand, 'Renames the bot');
api.addCommand('kill', killCommand, 'Stops the bot');
api.addCommand('userid', userIDCommand, 'Displays the ID of the user');

// Make the discord instance and API endpoints available for plugins
export {bot, api};
