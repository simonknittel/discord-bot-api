import config from '../config';
import bot from '../_modules/bot';
import pully from 'pully';

let playlist = [];

let voiceChannelID = null;
let currentSong = null;
function playLoop(channelID) {
    if (playlist.length < 1) {
        return false;
    }

    const nextSong = playlist[0];
    currentSong = nextSong;
    playlist.shift();

    bot.sendMessage({
        to: channelID,
        message: 'Now playing: ' + nextSong.url,
    });

    bot.testAudio({channel: voiceChannelID, stereo: true}, stream => {
        stream.playAudioFile(nextSong.file);
        stream.once('fileEnd', () => {
            setTimeout(() => {
                currentSong = null;
                playLoop(channelID);
            }, 2000);
        });
    });
}

function addCommands() {
    bot.addCommand('add', (user, userID, channelID, message) => {
        const url = message.split(' ')[0];

        bot.sendMessage({
            to: channelID,
            message: 'Downloading the requested song.',
        });

        pully({
            url: url,
            preset: 'audio',
        }, (error, info, filePath) => {
            if (error) {
                bot.sendMessage({
                    to: channelID,
                    message: 'The download of the song ' + url + 'failed.',
                });
            } else {
                playlist.push({
                    url: url,
                    file: filePath,
                });
                bot.sendMessage({
                    to: channelID,
                    message: 'The song ' + url + ' downloaded and added to the playlist. It\'s now on position ' + playlist.length + '.',
                });
            }
        });
    });

    bot.addCommand('remove', () => {
        console.log('... removed from the playlist.');
    });

    bot.addCommand('skip', (user, userID, channelID) => {
        bot.testAudio({channel: voiceChannelID, stereo: true}, stream => {
            stream.stopAudioFile();
            currentSong = null;
        });

        setTimeout(() => {
            playLoop(channelID);
        }, 2000);
    });

    bot.addCommand('enter', (user, userID, channelID, message) => {
        let notFound = true;
        Object.keys(bot.servers[config.serverID].channels).forEach((id) => {
            const channel = bot.servers[config.serverID].channels[id];

            if (channel.name === message && channel.type === 'voice') {
                voiceChannelID = id;
                notFound = false;
            }
        });

        if (notFound) {
            bot.sendMessage({
                to: channelID,
                message: 'There is no channel named ' + message + '.',
            });
        } else {
            bot.joinVoiceChannel(voiceChannelID);
        }
    });

    bot.addCommand('play', (user, userID, channelID) => {
        if (!voiceChannelID) {
            bot.sendMessage({
                to: channelID,
                message: 'The bot is not in a voice channel.',
            });
        } else if (playlist.length <= 0) {
            bot.sendMessage({
                to: channelID,
                message: 'There are currently no songs on the playlist.',
            });
        } else {
            playLoop(channelID);
        }
    });

    bot.addCommand('stop', () => {
        bot.testAudio({channel: voiceChannelID, stereo: true}, stream => {
            stream.stopAudioFile();
            currentSong = null;
        });
    });

    bot.addCommand('current', () => {
        bot.sendMessage({
            to: channelID,
            message: 'Currently playing: ' + currentSong.url,
        });
    });

    bot.addCommand('playlist', (user, userID, channelID) => {
        if (playlist.length < 1) {
            bot.sendMessage({
                to: channelID,
                message: 'There are currently no songs on the playlist.',
            });
        } else {
            let string = '';
            for (const song of playlist) {
                string += ', ' + song.url;
            }
            string = string.substring(1);
            bot.sendMessage({
                to: channelID,
                message: 'Current playlist: ' + string,
            });
        }
    });
}

addCommands();
