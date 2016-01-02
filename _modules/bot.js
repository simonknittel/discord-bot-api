// Discord Bot API
import configModule from './config';
import plugins from './plugins';
import api from './api';
import events from './events';

// Other
import DiscordClient from 'discord.io';
import chalk from 'chalk';
import packageJSON from '../package';

let bot = null; // The Discord instance will be stored in this object
let commandHistory = {};
let reconnectInterval = null;

// Handle incomming message
function handleMessage(user, userID, channelID, message, rawEvent) {
    // Only listen on the server defined by the config.json
    if (bot.serverFromChannel(channelID) !== configModule.get().serverID) {
        return false;
    }

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

    // Check if the global command prefix is on the first position of the message
    if (message.indexOf(configModule.get().globalCommandPrefix) !== 0) {
        return false;
    }

    // Remove the global command prefix from the message
    message = message.substring(configModule.get().globalCommandPrefix.length).trim();

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

    // Split message by spaces
    message = message.split(' ');

    // Search for the command
    for (let key in plugins) {
        if (plugins.hasOwnProperty(key)) {
            let plugin = plugins[key];

            // Get the command prefix of the plugin
            let pluginCommandPrefix = configModule.get().plugins && configModule.get().plugins[plugin.name] && configModule.get().plugins[plugin.name].commandPrefix && configModule.get().plugins[plugin.name].commandPrefix.length > 0
                ? configModule.get().plugins[plugin.name].commandPrefix
                : plugin.defaultCommandPrefix;

            if (!pluginCommandPrefix || message[0] === pluginCommandPrefix) {
                if (pluginCommandPrefix) {
                    // Remove the prefix of the plugin from the message
                    message.shift();
                }

                for (let command in plugin.commands) {
                    if (plugin.commands.hasOwnProperty(command)) {
                        if (message[0] === command) {
                            // Remove the requested command from the message
                            message.shift();

                            // Check the permissions of the command
                            if (
                                configModule.get().plugins
                                && configModule.get().plugins[plugin.name]
                                && configModule.get().plugins[plugin.name].commands
                                && configModule.get().plugins[plugin.name].commands[command]
                                && configModule.get().plugins[plugin.name].commands[command].requirePermission
                            ) {
                                if (!api.isOperator(userID, plugin.name + ':' + command, channelID)) {
                                    return false;
                                }
                            }

                            //
                            message = message.join(' ');

                            // Execute the command
                            plugin.commands[command].fn(user, userID, channelID, message, rawEvent);
                            return true;
                        }
                    }
                }
            }
        }
    }

    return false;
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
    console.log('v' + packageJSON.version);
    console.log(''); // Empty line

    reconnectInterval = null;

    // Set the name of the bot to the one defined in the configModule.json
    if (configModule.get().credentials.name) {
        bot.editUserInfo({
            password: configModule.get().credentials.password,
            username: configModule.get().credentials.name,
        });
    }

    // Accept the invites defined in the config.json
    if (configModule.get().invites) {
        for (const invite of configModule.get().invites) {
            const inviteID = invite.replace('https://discord.gg/', '');
            if (inviteID.length <= 0) {
                continue;
            }

            bot.acceptInvite(inviteID);
        }
    }

    // Listen for update events
    events.on('update', data => {
        // Send private message to owner
        if (configModule.get().ownerID) {
            bot.sendMessage({
                to: configModule.get().ownerID,
                message: 'There is a new version available for the bot.\n\n'
                    + 'Visit <https://github.com/simonknittel/discord-bot-api> to download the latest version.\n'
                    + 'Check out the CHANGELOG.md file for important changes.\n\n'
                    + 'Your version: ' + data.currentVersion + '\n'
                    + 'Latest version: ' + data.latestVersion + '\n',
            });
        }
    });
});

// Try to reconnect
bot.on('disconnected', () => {
    console.log(chalk.red('Discord Bot API disconnected.'));
    console.log('Trying to reconnect ...');
    console.log('');

    reconnectInterval = setInterval(() => {
        bot.connect();
    }, 600000);
});

// Trigger on incomming message
bot.on('message', handleMessage);

// Make the discord instance, API endpoints and config available for plugins
export default bot;
