// Discord Bot API
import configModule from '../../_modules/config';
// import api from '../../_modules/api';
import bot from '../../_modules/bot';
import plugins from '../../_modules/plugins';

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

function killCommand(user, userID) {
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
        config: {
            fn: configCommand,
            description: 'Change the config until the next restart _(requires permission)_',
        },
        kill: {
            fn: killCommand,
            description: 'Stops the bot _(requires permission)_',
        },
        userid: {
            fn: userIDCommand,
            description: 'Returns the ID of the user',
        },
    },
};

export default plugin;
