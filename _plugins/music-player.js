import bot from '../_modules/bot';

let playlist = [];

function addCommands() {
    bot.addCommand('add', () => {
        console.log('... added to the playlist added.');
    });

    bot.addCommand('remove', () => {
        console.log('... removed from the playlist.');
    });

    bot.addCommand('skip', () => {});
    bot.addCommand('play', () => {});
    bot.addCommand('stop', () => {});
    bot.addCommand('current', () => {});

    bot.addCommand('playlist', (user, userID, channelID, message, rawEvent) => {
        if (playlist.length < 1) {
            bot.sendMessage({
                to: channelID,
                message: 'There are currently no songs on the playlist.',
            });
        } else {
            bot.sendMessage({
                to: channelID,
                message: 'Current playlist: ' + playlist.join(', '),
            });
        }
    });
}

addCommands();
