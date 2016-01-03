// Discord Bot API
import configModule from '../../_modules/config';
import bot from '../../_modules/bot';
import {plugins} from '../../_modules/plugins';

// Other
import chalk from 'chalk';
import packageJSON from '../../package';

function aboutCommand(user, userID, channelID) {
    bot.sendMessage({
        to: channelID,
        message: 'Hey there, my name is the `Discord Bot API`. I\'m made by Simon Knittel (<hallo@simonknittel.de>) and based on the Node.js library called discord.io (<https://github.com/izy521/discord.io>). My main feature is to offer a API for plugins that can be used with me. Visit <' + packageJSON.homepage + '> for more information. If you find bugs or have other issues please report them here <' + packageJSON.bugs.url + '>. Enter `' + configModule.get().globalCommandPrefix + 'commands` to get all my commands.',
    });
}

function commandsCommand(user, userID, channelID) {
    let string = '';

    // Search for the commands
    for (let key in plugins) {
        if (plugins.hasOwnProperty(key)) {
            let plugin = plugins[key];

            string += '\n**' + plugin.name + '**\n';

            // Get the command prefix of the plugin
            let pluginCommandPrefix = configModule.get().plugins && configModule.get().plugins[plugin.name] && configModule.get().plugins[plugin.name].commandPrefix && configModule.get().plugins[plugin.name].commandPrefix.length > 0
                ? configModule.get().plugins[plugin.name].commandPrefix
                : plugin.defaultCommandPrefix;

            for (let command in plugin.commands) {
                if (plugin.commands.hasOwnProperty(command)) {
                    string += '`' + configModule.get().globalCommandPrefix
                        + (pluginCommandPrefix ? pluginCommandPrefix + ' ' : '')
                        + command + '`'
                        + ' ' + plugin.commands[command].description
                        + '\n';
                }
            }

            string += '\n';
        }
    }

    bot.sendMessage({
        to: channelID,
        message: string,
    });
}

function configCommand(user, userID, channelID, message) {
    message = message.split(' ');

    // Check if a property and a new value is present
    if (message.length < 2) {
        bot.sendMessage({
            to: channelID,
            message: 'Example use of this command: `!config credentials.name The Best Bot`',
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

    // Save the new config
    configModule.save(newConfig, error => {
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
            message: 'Config successfully changed.',
        });
    });
}

function killCommand() {
    console.log(chalk.yellow('The Discord Bot API got stopped through the kill command.'));
    console.log(''); // Empty line
    process.exit();
}

function userIDCommand(user, userID, channelID) {
    bot.sendMessage({
        to: channelID,
        message: 'Your ID: `' + userID + '`',
    });
}

function enableCommand(user, userID, channelID, message) {
    const pluginName = message.split(' ')[0].toLowerCase();

    if (pluginName.length < 1) {
        bot.sendMessage({
            to: channelID,
            message: 'You have to provide the name of the plugin.',
        });
        return false;
    }

    enablePlugin(pluginName, error => {
        if (error === 'failed to load') {
            bot.sendMessage({
                to: channelID,
                message: 'The plugin `' + pluginName + '` could not be enabled.',
            });
            console.log(chalk.red('Plugin ' + pluginName + ' failed to load'));
            console.log(''); // Empty line
            return false;
        } else if (error === 'already enabled') {
            bot.sendMessage({
                to: channelID,
                message: 'The plugin is already enabled.',
            });
            return false;
        }

        bot.sendMessage({
            to: channelID,
            message: 'Plugin successfully enabled.',
        });
        console.log('Plugin ' + pluginName + ' loaded');
        console.log(''); // Empty line
        return true;
    });
}

// function restartCommand() {}

function renameCommand(user, userID, channelID, message) {
    if (message.length < 1) {
        bot.sendMessage({
            to: channelID,
            message: 'You have to add the new name.',
        });
        return false;
    }

    configModule.rename(message, error => {
        if (error) {
            bot.sendMessage({
                to: channelID,
                message: 'There was an error with saving the new name to your config.json.',
            });
            return false;
        }

        bot.editUserInfo({
            username: message,
            password: configModule.get().credentials.password,
        }, () => {
            bot.sendMessage({
                to: channelID,
                message: 'Bot successfully renamed.',
            });
        });
    });
}

function opCommand(user, userID, channelID, message) {
    message = message.split(' ');
    if (message.length < 2) {
        bot.sendMessage({
            to: channelID,
            message: 'You have to add the user ID and the permission.',
        });
        return false;
    }

    configModule.op(message[0], message[1], error => {
        if (error) {
            bot.sendMessage({
                to: channelID,
                message: 'There was an error with saving the new permission to your config.json.',
            });
            return false;
        }

        bot.sendMessage({
            to: channelID,
            message: 'Permission successfully given.',
        });
        return true;
    });
}

function deopCommand(user, userID, channelID, message) {
    message = message.split(' ');
    if (message.length < 2) {
        bot.sendMessage({
            to: channelID,
            message: 'You have to add the user ID and the permission.',
        });
        return false;
    }

    configModule.deop(message[0], message[1], error => {
        if (error === 'no such permission') {
            bot.sendMessage({
                to: channelID,
                message: 'The user does not have such a permission.',
            });
            return false;
        } else if (error) {
            bot.sendMessage({
                to: channelID,
                message: 'There was an error with saving the removal of the permission to your config.json.',
            });
            return false;
        }

        bot.sendMessage({
            to: channelID,
            message: 'Permission successfully removed.',
        });
        return true;
    });
}

function prefixCommand(user, userID, channelID, message) {
    const newPrefix = message.split(' ')[0];
    if (newPrefix.length < 1) {
        bot.sendMessage({
            to: channelID,
            message: 'You have to add the new prefix.',
        });
        return false;
    }

    configModule.prefix(newPrefix, error => {
        if (error) {
            bot.sendMessage({
                to: channelID,
                message: 'There was an error with saving the new prefix to your config.json.',
            });
            return false;
        }

        bot.sendMessage({
            to: channelID,
            message: 'Prefix successfully set.',
        });
        return true;
    });
}

let plugin = {
    name: 'general',
    commands: {
        about: {
            fn: aboutCommand,
            description: 'Shows a short description of the bot',
        },
        commands: {
            fn: commandsCommand,
            description: 'Shows all available commands',
        },
        kill: {
            fn: killCommand,
            description: 'Stops the bot',
        },
        userid: {
            fn: userIDCommand,
            description: 'Returns the ID of the user',
        },
        enable: {
            fn: enableCommand,
            description: 'Enables a plugin',
        },
        // restart: {
        //     fn: restartCommand,
        //     description: 'Restarts the bot',
        // },
        rename: {
            fn: renameCommand,
            description: 'Renames the bot',
        },
        op: {
            fn: opCommand,
            description: 'Adds a permission to a user',
        },
        deop: {
            fn: deopCommand,
            description: 'Removes a permission from a user',
        },
        prefix: {
            fn: prefixCommand,
            description: 'Changes to global command prefix',
        },
    },
};

export default plugin;
