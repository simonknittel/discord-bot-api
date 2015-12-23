import bot from '../_modules/bot';

let participants = [];

function addCommands() {
    bot.addCommand('create', () => {
        console.log('Raffle created.');
    });

    bot.addCommand('start', () => {
        console.log('Raffle started. Enter !join to join the raffle.');
    });

    bot.addCommand('join', () => {
        console.log('... joined the raffle.');
    });

    bot.addCommand('leave', () => {
        console.log('... left the raffle.');
    });

    bot.addCommand('list', () => {
        if (participants.length < 1) {
            bot.sendMessage({
                to: channelID,
                message: 'There are currently no participants in the raffle.',
            });
        } else {
            bot.sendMessage({
                to: channelID,
                message: 'Current participants of the raffle: ' + participants.join(', '),
            });
        }
    });

    bot.addCommand('draw', () => {
        console.log('The winner of the raffle is ...');
    });
}

addCommands();
