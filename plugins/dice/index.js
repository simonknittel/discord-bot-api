// Discord Bot API
import bot from '../../modules/bot';

function rollCommand(user, userID, channelID, message) {
    message = message.split(' ');
    if (message.length < 1 || message[0].length < 1 || isNaN(message[0])) {
        bot.sendMessage({
            to: channelID,
            message: 'You have to define the amount of faces.',
        });

        return false;
    }

    const faces = Number(message[0]);
    const result = Math.floor(Math.random() * faces) + 1;

    bot.sendMessage({
        to: channelID,
        message: user + ' rolled a ' + result,
    });
}

let plugin = {
    name: 'dice',
    defaultCommandPrefix: 'dice',
    commands: {
        roll: {
            fn: rollCommand,
            description: 'Rolls a dice',
        },
    },
};

export default plugin;
