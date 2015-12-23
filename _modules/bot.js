import config from '../config';
import DiscordClient from 'discord.io';

function setName(bot, name) {
    bot.editUserInfo({
        password: config.credentials.password,
        username: name,
    });
}

let commands = {};
function addCommand(command, fn) {
    commands[command] = fn;
}

addCommand('about', (bot, user, userID, channelID, message, rawEvent) => {
    bot.sendMessage({
        to: channelID,
        message: 'Beep',
    });
});

addCommand('commands', (bot, user, userID, channelID, message, rawEvent) => {
    bot.sendMessage({
        to: channelID,
        message: '`!commands` - Shows all available commands\n'
               + '`!about` - Shows the version, description and contributors of the bot\n'
               + '`!rename` - Renames the bot\n'
               + '`!kill` - Stops the bot\n',
    });
});

addCommand('rename', (bot, user, userID, channelID, message, rawEvent) => {
    if (userID !== config.ownerID) {
        return false;
    }

    setName(bot, message);
});

addCommand('kill', (bot, user, userID, channelID, message, rawEvent) => {
    if (userID !== config.ownerID) {
        return false;
    }

    console.log('The Discord Bot got stopped through the kill command.');
    process.exit();
});

const bot = new DiscordClient({
    email: config.credentials.email,
    password: config.credentials.password,
    autorun: true,
});

bot.on('ready', () => {
    console.log('Discord Bot started.');
    setName(bot, config.credentials.name);
});

bot.on('message', (user, userID, channelID, message, rawEvent) => {
    if (message.indexOf(config.commandPrefix) !== 0) {
        return false;
    }

    const requestedCommand = message.split(' ')[0].substring(config.commandPrefix.length);
    if (requestedCommand.length < 1) {
        return false;
    }

    if (userID !== config.ownerID) {
        return false;
    }

    if (!commands[requestedCommand]) {
        return false;
    }

    commands[requestedCommand](bot, user, userID, channelID, message.substring(message.split(' ')[0].length).trim(), rawEvent);
});

export default bot;
