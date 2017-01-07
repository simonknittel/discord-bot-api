// Discord Bot API
import configModule from '../../modules/config';
import bot from '../../modules/bot';
import {plugins} from '../../modules/plugins';

// Other
import chalk from 'chalk';
import packageJSON from '../../package';
import request from 'request';
import fs from 'fs';

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
                    // Create a list with enabled synonyms for this command
                    let synonyms = [];

                    // Check plugins default synonyms
                    if (plugin.commands[command].synonyms) synonyms = plugin.commands[command].synonyms;

                    if (synonyms.indexOf(command) < 0) synonyms.unshift(command);

                    // Check config.json for synonyms
                    if (
                        configModule.get().plugins
                        && configModule.get().plugins[plugin.name]
                        && configModule.get().plugins[plugin.name].commands
                        && configModule.get().plugins[plugin.name].commands[command]
                        && configModule.get().plugins[plugin.name].commands[command].synonyms
                    ) {
                        for (let synonym in configModule.get().plugins[plugin.name].commands[command].synonyms) {
                            if (configModule.get().plugins[plugin.name].commands[command].synonyms.hasOwnProperty(synonym)) {
                                if (configModule.get().plugins[plugin.name].commands[command].synonyms[synonym].enabled) {
                                    if (synonyms.indexOf(synonym) < 0) {
                                        synonyms.push(synonym);
                                    }
                                } else if (configModule.get().plugins[plugin.name].commands[command].synonyms[synonym].enabled === false) {
                                    const index = synonyms.indexOf(synonym);
                                    if (index >= 0) {
                                        synonyms.splice(index, 1);
                                    }
                                }
                            }
                        }
                    }

                    // Compile string
                    string += '`' + configModule.get().globalCommandPrefix
                        + (pluginCommandPrefix ? pluginCommandPrefix + ' ' : '')
                        + synonyms[0] + '`'
                        + ' ' + plugin.commands[command].description;

                    synonyms.shift();

                    if (synonyms.length > 0) {
                        string += ' (synonyms: `' + synonyms.join('`, `') + '`)'
                            + '\n';
                    } else {
                        string += '\n';
                    }
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

// function configCommand(user, userID, channelID, message) {
//     message = message.split(' ');
//
//     // Check if a property and a new value is present
//     if (message.length < 2) {
//         bot.sendMessage({
//             to: channelID,
//             message: 'Example use of this command: `!config credentials.name The Best Bot`',
//         });
//
//         return false;
//     }
//
//     let changingProperty = message[0].split('.');
//     message.shift(); // Remove the property from the message
//     let newValue = message.join(' ');
//     if (newValue === 'true') { // Make a boolean to a true boolean type
//         newValue = true;
//     } else if (newValue === 'false') { // Make a boolean to a true boolean type
//         newValue = false;
//     } else if (isNaN(newValue)) { // Make a number to a true number type
//         newValue = newValue;
//     } else {
//         newValue = Number(newValue);
//     }
//
//     // Create a object
//     let newConfig = {};
//     for (let i = changingProperty.length - 1; i >= 0; i--) {
//         if (i === changingProperty.length - 1) {
//             newConfig[changingProperty[i]] = newValue;
//         } else {
//             let lastSegment = JSON.parse(JSON.stringify(newConfig));
//             newConfig = {};
//             newConfig[changingProperty[i]] = lastSegment;
//         }
//     }
//
//     // Save the new config
//     configModule.save(newConfig, error => {
//         if (error) {
//             console.error(error);
//             bot.sendMessage({
//                 to: channelID,
//                 message: 'There was a problem with saving the new config.',
//             });
//
//             return false;
//         }
//
//         bot.sendMessage({
//             to: channelID,
//             message: 'Config successfully changed.',
//         });
//     });
// }

function killCommand() {
    bot.disconnect();

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

    configModule.enablePlugin(pluginName, (error) => {
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
        } else if (error !== null) {
            bot.sendMessage({
                to: channelID,
                message: 'The plugin `' + pluginName + '` could not be enabled.',
            });
            console.log(chalk.red('Plugin ' + pluginName + ' could not be enabled'));
            console.log(chalk.red(error));
            console.log(''); // Empty line
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
                message: 'There was an error with saving the new name to your `config.json`.',
            });
            return false;
        }

        if (bot.username === message.trim()) {
            bot.sendMessage({
                to: channelID,
                message: 'No renaming needed.',
            });
            return false;
        }

        bot.editUserInfo({
            username: message,
        }, (error) => {
            if (error) {
                console.log(chalk.red(error));
                console.log(error);
                console.log(''); // Empty line

                bot.sendMessage({
                    to: channelID,
                    message: 'There was an error with renaming the bot. Check out the console for more information.',
                });
                return false;
            }

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

    const operatorID = message[0];
    message.shift();

    configModule.op(operatorID, message, error => {
        if (error) {
            bot.sendMessage({
                to: channelID,
                message: 'There was an error with saving the new permission to your `config.json`.',
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

    const operatorID = message[0];
    message.shift();

    configModule.deop(operatorID, message, error => {
        if (error === 'no such permission') {
            bot.sendMessage({
                to: channelID,
                message: 'The user does not have such a permission.',
            });
            return false;
        } else if (error) {
            bot.sendMessage({
                to: channelID,
                message: 'There was an error with saving the removal of the permission to your `config.json`.',
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
                message: 'There was an error with saving the new prefix to your `config.json`.',
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

function ownerCommand(user, userID, channelID, message) {
    let newOwner = message.trim().split(' ')[0];

    // Message is empty
    if (newOwner.length < 1) {
        bot.sendMessage({
            to: channelID,
            message: 'You have to add the user id of the new owner or mention him.',
        });
        return false;
    }

    // Get user id by mention
    if (newOwner.indexOf('<@') === 0) {
        newOwner = newOwner.replace('<@', '');
        newOwner = newOwner.replace('>', '');
    }

    // Check if user is known to he bot
    let knownByTheBot = false;
    for (const userID in bot.users) {
        if (newOwner === userID) {
            knownByTheBot = true;
            break;
        }
    }

    if (!knownByTheBot) {
        bot.sendMessage({
            to: channelID,
            message: 'The bot does not know the user.',
        });
        return false;
    }

    configModule.owner(newOwner, error => {
        if (error) {
            bot.sendMessage({
                to: channelID,
                message: 'There was an error with saving the new owner to your `config.json`.',
            });
            return false;
        }

        bot.sendMessage({
            to: channelID,
            message: 'Owner successfully changed.',
        });
        return true;
    });
}

function reloadCommand(user, userID, channelID) {
    configModule.reload(error => {
        if (error) {
            bot.sendMessage({
                to: channelID,
                message: 'There was an error with loading your `config.json`.',
            });
            return false;
        }

        bot.sendMessage({
            to: channelID,
            message: '`config.json` successfully reloaded.',
        });
        return true;
    });
}

function setAvatar(base64, channelID) {
    bot.editUserInfo({
        avatar: base64,
        password: configModule.get().credentials.password,
    }, () => {
        bot.sendMessage({
            to: channelID,
            message: 'Avatar successfully changed.',
        });
    });
}

function avatarCommand(user, userID, channelID, message) {
    const path = message.split(' ')[0];
    if (path.length < 1) {
        bot.sendMessage({
            to: channelID,
            message: 'You have to add a relative path or an url to the new avatar.',
        });
        return false;
    }

    configModule.avatar(path, error => {
        if (error) {
            bot.sendMessage({
                to: channelID,
                message: 'There was an error with saving the new avatar to your `config.json`.',
            });
            return false;
        }

        // Set the avatar of the bot to the one defined in the config.json
        if (configModule.get().credentials.avatar && configModule.get().credentials.avatar !== null) {
            const reg = new RegExp(/^(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)$/, 'gi');
            if (reg.test(configModule.get().credentials.avatar)) {
                request({
                    url: configModule.get().credentials.avatar,
                    encoding: null,
                }, (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        setAvatar(new Buffer(body).toString('base64'), channelID);
                    } else {
                        console.log(chalk.red('The avatar could not be set. Make sure the path is correct.'));
                    }
                });
            } else {
                setAvatar(fs.readFileSync(configModule.get().credentials.avatar, 'base64'), channelID);
            }
        } else if (configModule.get().credentials.avatar === null) {
            bot.editUserInfo({
                avatar: null,
                password: configModule.get().credentials.password,
            }, () => {
                bot.sendMessage({
                    to: channelID,
                    message: 'Avatar successfully changed.',
                });
            });
        }
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
            synonyms: [
                'help',
            ],
        },
        kill: {
            fn: killCommand,
            description: 'Stops the bot',
            requirePermission: true,
            synonyms: [
                'stop',
            ],
        },
        userid: {
            fn: userIDCommand,
            description: 'Returns the ID of the user',
            synonyms: [
                'me',
            ],
        },
        enable: {
            fn: enableCommand,
            description: 'Enables a plugin',
            requirePermission: true,
        },
        // restart: {
        //     fn: restartCommand,
        //     description: 'Restarts the bot',
        //     requirePermission: true,
        // },
        rename: {
            fn: renameCommand,
            description: 'Renames the bot',
            requirePermission: true,
        },
        op: {
            fn: opCommand,
            description: 'Adds a permission to a user',
            requirePermission: true,
        },
        deop: {
            fn: deopCommand,
            description: 'Removes a permission from a user',
            requirePermission: true,
        },
        prefix: {
            fn: prefixCommand,
            description: 'Changes to global command prefix',
            requirePermission: true,
        },
        owner: {
            fn: ownerCommand,
            description: 'Changes the owner of the bot',
            requirePermission: true,
        },
        reload: {
            fn: reloadCommand,
            description: 'Reloads your `config.json`',
            requirePermission: true,
            synonyms: [
                'refresh',
            ],
        },
        avatar: {
            fn: avatarCommand,
            description: 'Give the bot an avatar',
            requirePermission: true,
        },
    },
};

export default plugin;
