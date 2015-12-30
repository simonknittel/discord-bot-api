// Discord Bot API
import configModule from '../../_modules/config';
import bot from '../../_modules/bot';
// import api from '../../_modules/api';

// Other
import pully from 'pully';
import fetchVideoInfo from 'youtube-info';

let playlist = []; // All requested songs will be saved in this array
let voiceChannelID = null; // The ID of the voice channel the bot has entered will be saved in this variable
let currentSong = null; // The current song will be saved in this variable

// Iterate through the playlist until there are no songs anymore
function playLoop(channelID) {
    // Check if the bot is in a voice channel
    if (voiceChannelID) {
        if (playlist.length < 1) {
            return false;
        }

        const nextSong = playlist[0]; // Get the first song of the playlist
        playlist.shift(); // Removes the now playing song from the playlist
        currentSong = nextSong;

        bot.setPresence({
            game: nextSong.title,
        });

        bot.sendMessage({
            to: channelID,
            message: 'Now playing: ' + nextSong.url,
        });

        bot.getAudioContext({channel: voiceChannelID, stereo: true}, stream => {
            stream.playAudioFile(nextSong.file);
            stream.once('fileEnd', () => {
                // Hack required because the event fileEnd does not trigger when the file ends
                setTimeout(() => {
                    currentSong = null;
                    bot.setPresence({
                        game: null,
                    });
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

function extractYouTubeID(url, channelID) {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const matches = url.match(regExp);
    if (matches && matches[2].length === 11) {
        return matches[2];
    } else {
        bot.sendMessage({
            to: channelID,
            message: 'This seems to be an invalid link.',
        });
        return false;
    }
}

function addCommand(user, userID, channelID, message) {
    // Get the URL from the message (it should be the first element after the command)
    const url = message.split(' ')[0];

    if (url.length < 1) {
        bot.sendMessage({
            to: channelID,
            message: 'You have to add a link to your command.',
        });

        return false;
    }

    // Extract YouTube ID
    const youtubeID = extractYouTubeID(url, channelID);
    if (!youtubeID) {
        return false;
    }

    bot.sendMessage({
        to: channelID,
        message: 'Downloading the requested video ...',
    });

    // Fetch meta data from YouTube video
    fetchVideoInfo(youtubeID).then(videoInfo => {
        // Download the requested song
        pully({
            url: videoInfo.url,
            preset: 'audio',
        }, (error, info, filePath) => {
            if (error) {
                bot.sendMessage({
                    to: channelID,
                    message: 'The download of <' + videoInfo.url + '> failed.',
                });
            } else {
                // Add the song to the playlist
                playlist.push({
                    youtubeID: videoInfo.videoId,
                    url: videoInfo.url,
                    title: videoInfo.title,
                    owner: videoInfo.owner,
                    duration: videoInfo.duration,
                    file: filePath,
                });
                bot.sendMessage({
                    to: channelID,
                    message: '`' + videoInfo.title + '` added to the playlist. Position: ' + playlist.length,
                });
            }
        });
    });
}

function removeCommand(user, userID, channelID, message) {
    const url = message.split(' ')[0];

    if (url.length < 1) {
        bot.sendMessage({
            to: channelID,
            message: 'You have to add a link to your command.',
        });

        return false;
    }

    // Extract YouTube ID
    const youtubeID = extractYouTubeID(url, channelID);
    if (!youtubeID) {
        return false;
    }

    playlist = playlist.filter(element => element.youtubeID !== youtubeID);

    bot.sendMessage({
        to: channelID,
        message: 'Successfully removed from the playlist.',
    });
}

function skipCommand(user, userID, channelID) {
    // Check if the user has the permission
    // if (!bot.isOperator(userID, 'music-bot:skip')) {
    //     return false;
    // }

    // Check if the bot is in a voice channel
    if (voiceChannelID) {
        bot.testAudio({channel: voiceChannelID, stereo: true}, stream => {
            stream.stopAudioFile();
            currentSong = null;
            bot.setPresence({
                game: null,
            });
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
    // Check if the user has the permission
    // if (!api.isOperator(userID, 'music-bot:enter')) {
    //     return false;
    // }

    let notFound = true;
    // Look for the ID of the requested channel
    Object.keys(bot.servers[configModule.get().serverID].channels).forEach((id) => {
        const channel = bot.servers[configModule.get().serverID].channels[id];

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
            message: 'There are currently no entries on the playlist.',
        });
    } else {
        playLoop(channelID);
    }
}

function stopCommand() {
    bot.testAudio({channel: voiceChannelID, stereo: true}, stream => {
        stream.stopAudioFile();
        currentSong = null;
        bot.setPresence({
            game: null,
        });
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
            message: 'There is currently nothing playing.',
        });
    }
}

function playlistCommand(user, userID, channelID) {
    // Check if there are songs on the playlist
    if (playlist.length < 1) {
        bot.sendMessage({
            to: channelID,
            message: 'There are currently no entries on the playlist.',
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

let plugin = {
    name: 'music-bot',
    defaultCommandPrefix: 'music',
    commands: {
        add: {
            fn: addCommand,
            description: 'Adds a song to the playlist',
        },
        remove: {
            fn: removeCommand,
            description: 'Removes a song from the playlist',
        },
        skip: {
            fn: skipCommand,
            description: 'Skips the current song',
        },
        enter: {
            fn: enterCommand,
            description: 'Let the bot enter a voice channel',
        },
        play: {
            fn: playCommand,
            description: 'Starts the playlist',
        },
        stop: {
            fn: stopCommand,
            description: 'Stops the playlist',
        },
        current: {
            fn: currentCommand,
            description: 'Displays the current song',
        },
        playlist: {
            fn: playlistCommand,
            description: 'Displays all songs on the playlist',
        },
    },
};

export default plugin;
