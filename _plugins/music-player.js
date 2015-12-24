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
        if (voiceChannelID) {
            const url = message.split(' ')[0];

            bot.sendMessage({
                to: channelID,
                message: 'Downloading the requested song now.',
            });

            pully({
                url: url,
                preset: 'audio',
            }, (error, info, filePath) => {
                if (error) {
                    bot.sendMessage({
                        to: channelID,
                        message: 'The download of the song `' + url + '` failed.',
                    });
                } else {
                    playlist.push({
                        url: url,
                        file: filePath,
                    });
                    bot.sendMessage({
                        to: channelID,
                        message: 'The song `' + url + '` downloaded and added to the playlist. It\'s now on position ' + playlist.length + '.',
                    });
                }
            });
        } else {
            bot.sendMessage({
                to: channelID,
                message: 'The bot is not in a voice channel.',
            });
        }
    }, 'Adds a song to the playlist (Example: `' + config.commandPrefix + 'add https://www.youtube.com/watch?v=iyqfHvoUtkU`)');

    bot.addCommand('remove', (user, userID, channelID, message) => {
        const url = message.split(' ')[0];

        playlist = playlist.filter(element => element.url !== url);

        bot.sendMessage({
            to: channelID,
            message: 'Song removed from the playlist.',
        });
    }, 'Removes a song from the playlist (Example: `' + config.commandPrefix + 'remove https://www.youtube.com/watch?v=iyqfHvoUtkU`)');

    bot.addCommand('skip', (user, userID, channelID) => {
        if (voiceChannelID) {
            bot.testAudio({channel: voiceChannelID, stereo: true}, stream => {
                stream.stopAudioFile();
                currentSong = null;
            });

            setTimeout(() => {
                playLoop(channelID);
            }, 2000);
        } else {
            bot.sendMessage({
                to: channelID,
                message: 'The bot is not in a voice channel.',
            });
        }
    }, 'Skips the current song');

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
    }, 'Let the bot enter a voice channel (Example: `' + config.commandPrefix + 'enter Channel name`)');

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
    }, 'Starts the playlist');

    bot.addCommand('stop', () => {
        bot.testAudio({channel: voiceChannelID, stereo: true}, stream => {
            stream.stopAudioFile();
            currentSong = null;
        });
    }, 'Stops the playlist');

    bot.addCommand('current', () => {
        bot.sendMessage({
            to: channelID,
            message: 'Currently playing: ' + currentSong.url,
        });
    }, 'Displays the current song');

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
    }, 'Displays all songs on the playlist');
}

addCommands();
