import config from '../../config';
import {bot, api} from '../../_modules/bot';
import pully from 'pully';

let playlist = [];

let voiceChannelID = null;
let currentSong = null;
// Iterate through the playlist until there are no songs anymore
function playLoop(channelID) {
    // Check if the bot is in a voice channel
    if (voiceChannelID) {
        if (playlist.length < 1) {
            return false;
        }

        const nextSong = playlist[0];
        currentSong = nextSong;
        playlist.shift(); // Removes the now playing song from the playlist

        bot.sendMessage({
            to: channelID,
            message: 'Now playing: ' + nextSong.url,
        });

        bot.testAudio({channel: voiceChannelID, stereo: true}, stream => {
            stream.playAudioFile(nextSong.file);
            stream.once('fileEnd', () => {
                // Hack required because the event fileEnd does not trigger when the file ends
                setTimeout(() => {
                    currentSong = null;
                    playLoop(channelID);
                }, 2000);
            });
        });
    } else {
        bot.sendMessage({
            to: channelID,
            message: 'The bot is not in a voice channel.',
        });
    }
}

function addCommand(user, userID, channelID, message) {
    // Get the URL from the message (it should be the first element after the command)
    const url = message.split(' ')[0];

    if (url.length < 1) {
        bot.sendMessage({
            to: channelID,
            message: 'You have to add a YouTube link to your command.',
        });

        return false;
    }

    bot.sendMessage({
        to: channelID,
        message: 'Downloading the requested song now.',
    });

    // Download the requested song
    pully({
        url: url,
        preset: 'audio',
    }, (error, info, filePath) => {
        if (error) {
            bot.sendMessage({
                to: channelID,
                message: 'The download of the song <' + url + '> failed.',
            });
        } else {
            // Add the song to the playlist
            playlist.push({
                url: url,
                file: filePath,
            });
            bot.sendMessage({
                to: channelID,
                message: 'The song <' + url + '> downloaded and added to the playlist. It\'s now on position ' + playlist.length + '.',
            });
        }
    });
}

function removeCommand(user, userID, channelID, message) {
    const url = message.split(' ')[0];

    if (url.length < 1) {
        bot.sendMessage({
            to: channelID,
            message: 'You have to add a YouTube link to your command.',
        });

        return false;
    }

    playlist = playlist.filter(element => element.url !== url);

    bot.sendMessage({
        to: channelID,
        message: 'Song removed from the playlist.',
    });
}

function skipCommand(user, userID, channelID) {
    // Check if the user has the permission to skip the current song
    // if (!bot.isOperator(userID, 'music-bot:skip')) {
    //     return false;
    // }

    // Check if the bot is in a voice channel
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
}

function enterCommand(user, userID, channelID, message) {
    let notFound = true;
    // Look for the ID of the requested channel
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
}

function playCommand(user, userID, channelID) {
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
}

function stopCommand() {
    bot.testAudio({channel: voiceChannelID, stereo: true}, stream => {
        stream.stopAudioFile();
        currentSong = null;
    });
}

function currentCommand(user, userID, channelID) {
    // Check if a song is playing
    if (currentSong) {
        bot.sendMessage({
            to: channelID,
            message: 'Currently playing: ' + currentSong.url,
        });
    } else {
        bot.sendMessage({
            to: channelID,
            message: 'There is currently no song playing.',
        });
    }
}

function playlistCommand(user, userID, channelID) {
    // Check if there are songs on the playlist
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
}

api.addCommand('add', addCommand, 'Adds a song to the playlist (Example: `' + config.commandPrefix + 'add https://www.youtube.com/watch?v=iyqfHvoUtkU`)');
api.addCommand('remove', removeCommand, 'Removes a song from the playlist (Example: `' + config.commandPrefix + 'remove https://www.youtube.com/watch?v=iyqfHvoUtkU`)');
api.addCommand('skip', skipCommand, 'Skips the current song');
api.addCommand('enter', enterCommand, 'Let the bot enter a voice channel (Example: `' + config.commandPrefix + 'enter General`)');
api.addCommand('play', playCommand, 'Starts the playlist');
api.addCommand('stop', stopCommand, 'Stops the playlist');
api.addCommand('current', currentCommand, 'Displays the current song');
api.addCommand('playlist', playlistCommand, 'Displays all songs on the playlist');
