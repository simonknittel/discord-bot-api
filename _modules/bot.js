// Discord Bot API
import configModule from './config';
import plugins from './plugins';

// Other
import DiscordClient from 'discord.io';
import chalk from 'chalk';

let bot = null; // The Discord instance will be stored in this object
let commandHistory = {};

// Handle incomming message
function handleMessage(user, userID, channelID, message, rawEvent) {
    // Check if a mention is required by the configModule.json
    if (configModule.get().mentionRequired) {
        // Check if the bot got mentioned
        if (message.indexOf('<@' + bot.id + '>') !== 0) {
            return false;
        }

        // Remove the mention from the message
        message = message.substring(('<@' + bot.id + '>').length);
        message = message.trim();
    }

    let globalCommandPrefix = configModule.get().globalCommandPrefix ? configModule.get().globalCommandPrefix : '!';

    // Check if the global command prefix is on the first position of the message
    if (message.indexOf(globalCommandPrefix) !== 0) {
        return false;
    }

    // Remove the global command prefix from the message
    message = message.substring(globalCommandPrefix.length).trim();

    // There is no requested command
    if (message.length < 1) {
        return false;
    }

    // Check if the cooldown of the user is already expired
    if (configModule.get().commandCooldown && commandHistory[userID]) {
        const timeDifference = new Date().getTime() - commandHistory[userID].getTime();
        // The cooldown is not yet expired
        if (timeDifference < configModule.get().commandCooldown) {
            return false;
        }
    }
    commandHistory[userID] = new Date();

    // Search for the command
    for (let key in plugins) {
        if (plugins.hasOwnProperty(key)) {
            let plugin = plugins[key];

            // Get the command prefix of the plugin
            let pluginCommandPrefix = configModule.get().plugins && configModule.get().plugins[plugin.name] && configModule.get().plugins[plugin.name].commandPrefix.length > 0
                ? configModule.get().plugins[plugin.name].commandPrefix
                : plugin.defaultCommandPrefix;

            if (!pluginCommandPrefix || message.indexOf(pluginCommandPrefix) === 0) {
                if (pluginCommandPrefix) {
                    // Remove the prefix of the plugin from the message
                    message = message.substring(pluginCommandPrefix.length).trim();
                }

                for (let command in plugin.commands) {
                    if (plugin.commands.hasOwnProperty(command)) {
                        if (message.indexOf(command) === 0) {
                            // Remove the requested command from the message
                            message = message.substring(command.length).trim();

                            // Execute the command
                            plugin.commands[command].fn(user, userID, channelID, message, rawEvent);
                            return true;
                        }
                    }
                }
            }
        }
    }
}

// Start the discord instance
bot = new DiscordClient({
    email: configModule.get().credentials.email,
    password: configModule.get().credentials.password,
    autorun: true,
});

// Discord instance is ready
bot.on('ready', () => {
    console.log(chalk.green('Discord Bot API started.'));

    // Set the name of the bot to the one defined in the configModule.json
    if (configModule.get().credentials.name) {
        bot.editUserInfo({
            password: configModule.get().credentials.password,
            username: configModule.get().credentials.name,
        });
    }
});

// Trigger on incomming message
bot.on('message', handleMessage);

// Make the discord instance, API endpoints and config available for plugins
export default bot;
