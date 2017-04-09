// Discord Bot API
import configModule from './config';
import {plugins} from './plugins';
import api from './api';
import events from './events';

// Other
import Discord from 'discord.io';
import chalk from 'chalk';
import packageJSON from '../../package';
import fs from 'fs';
import request from 'request';


let bot = null; // The Discord instance will be stored in this object
const commandHistory = {};
let reconnectInterval = null;


/**
 * Handles incomming message
 * @method handleMessage
 * @param  {String}       user      The name of the user who sent the message
 * @param  {String}       userID    The ID of the user who sent the message
 * @param  {String}       channelID The ID of the channel which the message was sent to
 * @param  {String}       message   The message itself
 * @param  {[type]}       rawEvent  [description]
 * @return {Boolean|Void}           Returns false when the bot should do nothing, returns nothing otherwise
 */
function handleMessage(user, userID, channelID, message, rawEvent) {
    if (configModule.get().debug) {
        console.log(
            chalk.yellow('DEBUG:'),
            chalk.blue('handleMessage()'),
            user, chalk.blue(`(${typeof user})`),
            userID, chalk.blue(`(${typeof userID})`),
            channelID, chalk.blue(`(${typeof channelID})`),
            message, chalk.blue(`(${typeof message})`)
        );
        console.log(''); // Empty line
    }

    // Only listen on the server defined by the config.cson
    if (bot.channels[channelID].guild_id !== configModule.get().serverID) return false;

    // Ignore messages by the bot itself
    if (userID === bot.id) return false;

    // Check if channel is ignored
    if (configModule.get().ignoreChannels) {
        for (let channelName of configModule.get().ignoreChannels) {
            channelName = channelName.replace('#', '');

            for (let id in bot.servers[configModule.get().serverID].channels) {
                if (Object.prototype.hasOwnProperty.call(bot.servers[configModule.get().serverID].channels, id)) {
                    const channel = bot.servers[configModule.get().serverID].channels[id];

                    if (channel.type !== 'text') continue;

                    if (channel.name === channelName && channel.id === channelID) return false;
                }
            }
        }
    }

    // Checks if a mention is required by the config.cson
    if (configModule.get().mentionRequired) {
        // Check if the bot got mentioned
        if (message.indexOf('<@' + bot.id + '>') !== 0) return false;

        // Remove the mention from the message
        message = message
                    .substring(('<@' + bot.id + '>').length)
                    .trim();
    }

    // Check if the global command prefix is on the first position of the message
    if (message.indexOf(configModule.get().globalCommandPrefix) !== 0) return false;

    // Remove the global command prefix from the message
    message = message
                .substring(configModule.get().globalCommandPrefix.length)
                .trim();

    // There is no requested command
    if (message.length < 1) return false;

    // Check if the cooldown of the user is already expired or if the user is the owner
    if (configModule.get().commandCooldown && commandHistory[userID] && userID !== configModule.get().ownerID) {
        const timeDifference = new Date().getTime() - commandHistory[userID].getTime();
        // The cooldown is not yet expired
        if (timeDifference < configModule.get().commandCooldown) return false;
    }
    commandHistory[userID] = new Date();

    // Split message by spaces
    message = message.split(' ');

    // Search for the command
    for (const key in plugins) {
        if (Object.prototype.hasOwnProperty.call(plugins, key)) {
            const plugin = plugins[key];

            // Get the command prefix of the plugin
            let pluginCommandPrefix = configModule.get().plugins && configModule.get().plugins[plugin.name] && configModule.get().plugins[plugin.name].commandPrefix && configModule.get().plugins[plugin.name].commandPrefix.length > 0
                ? configModule.get().plugins[plugin.name].commandPrefix
                : plugin.defaultCommandPrefix;

            if (!pluginCommandPrefix || message[0] === pluginCommandPrefix) {
                // Remove the prefix of the plugin from the message
                if (pluginCommandPrefix) message.shift();

                for (const command in plugin.commands) {
                    if (Object.prototype.hasOwnProperty.call(plugin.commands, command)) {
                        // Create a list with enabled synonyms for this command
                        let synonyms = [];

                        // Check plugins default synonyms
                        if (plugin.commands[command].synonyms) synonyms = plugin.commands[command].synonyms;

                        if (synonyms.indexOf(command) < 0) synonyms.unshift(command);

                        // Check config.cson for synonyms
                        if (
                            configModule.get().plugins
                            && configModule.get().plugins[plugin.name]
                            && configModule.get().plugins[plugin.name].commands
                            && configModule.get().plugins[plugin.name].commands[command]
                            && configModule.get().plugins[plugin.name].commands[command].synonyms
                        ) {
                            for (const synonym in configModule.get().plugins[plugin.name].commands[command].synonyms) {
                                if (Object.prototype.hasOwnProperty.call(configModule.get().plugins[plugin.name].commands[command].synonyms, synonym)) {
                                    if (configModule.get().plugins[plugin.name].commands[command].synonyms[synonym].enabled) {
                                        if (synonyms.indexOf(synonym) < 0) synonyms.push(synonym);
                                    } else if (configModule.get().plugins[plugin.name].commands[command].synonyms[synonym].enabled === false) {
                                        const index = synonyms.indexOf(synonym);
                                        if (index >= 0) synonyms.splice(index, 1);
                                    }
                                }
                            }
                        }

                        if (synonyms.indexOf(message[0]) >= 0) {
                            // Remove the requested command from the message
                            message.shift();

                            // Check the permissions of the command
                            let permissionRequiredByConfig = null;
                            if (
                                configModule.get().plugins
                                && configModule.get().plugins[plugin.name]
                                && configModule.get().plugins[plugin.name].commands
                                && configModule.get().plugins[plugin.name].commands[command]
                                && configModule.get().plugins[plugin.name].commands[command].requirePermission
                            ) {
                                permissionRequiredByConfig = true;
                            } else if (
                                configModule.get().plugins
                                && configModule.get().plugins[plugin.name]
                                && configModule.get().plugins[plugin.name].commands
                                && configModule.get().plugins[plugin.name].commands[command]
                                && configModule.get().plugins[plugin.name].commands[command].requirePermission === false
                            ) {
                                permissionRequiredByConfig = false;
                            }

                            if (permissionRequiredByConfig !== null) {
                                if (permissionRequiredByConfig && !api.isOperator(userID, plugin.name + ':' + command, channelID)) return false;
                            } else if (plugin.commands[command].requirePermission && !api.isOperator(userID, plugin.name + ':' + command, channelID)) {
                                return false;
                            }

                            // Check the command requires an channel
                            if (
                                configModule.get().plugins
                                && configModule.get().plugins[plugin.name]
                                && configModule.get().plugins[plugin.name].commands
                                && configModule.get().plugins[plugin.name].commands[command]
                                && configModule.get().plugins[plugin.name].commands[command].channel
                            ) {
                                const requestChannel = configModule.get().plugins[plugin.name].commands[command].channel.replace('#', '');

                                for (const id in bot.servers[configModule.get().serverID].channels) {
                                    if (Object.prototype.hasOwnProperty.call(bot.servers[configModule.get().serverID].channels, id)) {
                                        const channel = bot.servers[configModule.get().serverID].channels[id];

                                        if (channel.type !== 'text') continue;

                                        if (channel.name === requestChannel && channel.id !== channelID) {
                                            bot.sendMessage({
                                                to: channelID,
                                                message: `You can request this command only here <#${channel.id}>`,
                                            });
                                            return false;
                                        }
                                    }
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
bot = new Discord.Client({
    token: configModule.get().credentials.token,
    autorun: true,
});

// Discord instance is ready
bot.on('ready', () => {
    console.log(chalk.green('Discord API'));
    console.log('Connected');
    console.log(''); // Empty line

    console.log(chalk.green('Plugins'));
    for (const name in configModule.get().plugins) {
        if (Object.prototype.hasOwnProperty.call(configModule.get().plugins, name)) {
            if (!Object.prototype.hasOwnProperty.call(plugins, name)) {
                console.log(chalk.red(`${name} failed to load`));
                continue;
            }

            console.log(name + ' loaded');
        }
    }
    console.log(''); // Empty line

    reconnectInterval = null;

    const userInfo = {};

    // Set the name of the bot to the one defined in the config.cson
    if (configModule.get().credentials.name && configModule.get().credentials.name.trim() && bot.username !== configModule.get().credentials.name.trim()) userInfo.username = configModule.get().credentials.name;

    // Set the avatar of the bot to the one defined in the config.cson
    if (configModule.get().credentials.avatar && configModule.get().credentials.avatar !== null) {
        const reg = new RegExp(/^(http(s)?:\/\/.){1}(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)$/, 'gi');
        if (reg.test(configModule.get().credentials.avatar)) {
            request({
                url: configModule.get().credentials.avatar,
                encoding: null,
            }, (error, response, body) => {
                if (error) {
                    console.log(chalk.red(error));
                    console.log(error);
                    console.log(''); // Empty line
                    return false;
                }

                userInfo.avatar = new Buffer(body).toString('base64');
            });
        } else {
            userInfo.avatar = fs.readFileSync(configModule.get().credentials.avatar, 'base64');
        }

        // TODO: Check if new avatar is already set (issue #56)
    } else if (configModule.get().credentials.avatar === null) {
        userInfo.avatar = null;
    }

    bot.editUserInfo(userInfo, error => {
        if (error) {
            console.log(chalk.red(error));
            console.log(error);
            console.log(''); // Empty line
            return false;
        }
    });

    // Listen for update events
    events.on('update', data => {
        // Send private message to owner
        if (!configModule.get().ownerID) return false;

        bot.sendMessage({
            to: configModule.get().ownerID,
            message: 'There is a new version available for the bot.\n\n'
                + 'Visit <https://github.com/simonknittel/discord-bot-api> to download the latest version.\n'
                + 'Check out the CHANGELOG.md file for important changes.\n\n'
                + `Your version: ${data.currentVersion}\n`
                + `Latest version: ${data.latestVersion}\n`,
        });
    });

    console.log(chalk.green('Discord Bot API started.'));
    console.log('v' + packageJSON.version);
    console.log(''); // Empty line
});

// Try to reconnect
bot.on('disconnect', () => {
    clearInterval(reconnectInterval);

    console.log(chalk.red('Discord Bot API disconnected.'));
    console.log('Trying to reconnect ...');
    console.log(''); // Empty line

    reconnectInterval = setInterval(() => {
        bot.connect();
    }, 15000);
});

// Trigger on incomming message
bot.on('message', handleMessage);


// Make the discord instance, API endpoints and config available for plugins
export default bot;
