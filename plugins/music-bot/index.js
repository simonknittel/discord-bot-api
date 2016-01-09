// Discord Bot API
import configModule from '../../modules/config';
import bot from '../../modules/bot';
import events from '../../modules/events';

// Other
import fetchVideoInfo from 'youtube-info';
import YoutubeMp3Downloader from 'youtube-mp3-downloader';
import mkdirp from 'mkdirp';
import fs from 'fs';
import chalk from 'chalk';
import os from 'os';

let YD = new YoutubeMp3Downloader({
    outputPath: configModule.get().plugins['music-bot'].library ? configModule.get().plugins['music-bot'].library + '/youtube' : (os.platform() === 'win32' ? 'C:/Windows/Temp/youtube' : '/tmp/youtube'),
    queueParallelism: 5,
});

events.on('config reloaded', () => {
    YD = new YoutubeMp3Downloader({
        outputPath: configModule.get().plugins['music-bot'].library ? configModule.get().plugins['music-bot'].library + '/youtube' : (os.platform() === 'win32' ? 'C:/Windows/Temp/youtube' : '/tmp/youtube'),
        queueParallelism: 5,
    });
});

let playlist = []; // All requested songs will be saved in this array
let voiceChannelID = null; // The ID of the voice channel the bot has entered will be saved in this variable
let currentSong = null; // The current song will be saved in this variable
let downloadQueue = {};
let usersWantToSkip = []; // The id of the users that want to skip the current song will be stored in this array

YD.on('finished', data => {
    // Add the song to the playlist
    playlist.push({
        youtubeID: data.videoId,
        url: data.youtubeUrl,
        title: data.videoTitle,
        file: data.file,
    });
    bot.sendMessage({
        to: downloadQueue['yt:' + data.videoId].channelID,
        message: '`' + data.videoTitle + '` added to the playlist. Position: ' + playlist.length,
    });
    delete downloadQueue['yt:' + data.videoId];
});

YD.on('error', error => {
    console.error(error);
    // bot.sendMessage({
    //     to: downloadQueue['yt:' + error.videoId].channelID,
    //     message: 'The download of <' + error.youtubeURL + '> failed. Check out terminal of the bot to get more information.',
    // });
    // delete downloadQueue['yt:' + error.videoId];
});

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
        usersWantToSkip = [];
        bot.setPresence({
            game: nextSong.title,
        });

        const announceSongs = configModule.get().plugins['music-bot'].announceSongs === false ? false : true;
        if (announceSongs) {
            bot.sendMessage({
                to: channelID,
                message: 'Now playing: ' + nextSong.url,
            });
        }

        bot.getAudioContext({channel: voiceChannelID, stereo: true}, stream => {
            stream.playAudioFile(currentSong.file);
            stream.once('fileEnd', () => {
                if (currentSong) {
                    // Hack required because the event fileEnd does not trigger when the file ends ...
                    setTimeout(() => {
                        currentSong = null;
                        bot.setPresence({
                            game: null,
                        });
                        playLoop(channelID);
                    }, 2000);
                }
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

    // Fetch meta data from YouTube video
    fetchVideoInfo(youtubeID, (error, videoInfo) => {
        if (error) {
            console.error(error, youtubeID);
            bot.sendMessage({
                to: channelID,
                message: 'This seems to be an invalid link.',
            });
            return false;
        }

        // Check length of video
        let maxLength = configModule.get().plugins['music-bot'].maxLength;
        if (maxLength && isNaN(maxLength)) {
            console.log(chalk.styles.red.open + 'The max length of a song defined in your "config.json" is invalid. Therefore the download of ' + chalk.styles.red.close + videoInfo.url + chalk.styles.red.open + ' will be stopped.' + chalk.styles.red.close);
            bot.sendMessage({
                to: channelID,
                message: 'The max length of a song defined in your "config.json" is invalid. Therefore the download will be stopped.',
            });
            return false;
        } else if (Math.ceil(maxLength) === 0) {

        } else if (videoInfo.duration / 60 > Math.ceil(maxLength)) {
            bot.sendMessage({
                to: channelID,
                message: 'The video is too long. Only videos up to ' + Math.round(maxLength) + ' minutes are allowed.',
            });
            return false;
        } else if (videoInfo.duration / 60 > 15) {
            bot.sendMessage({
                to: channelID,
                message: 'The video is too long. Only videos up to 15 minutes are allowed.',
            });
            return false;
        }

        // Create download directory
        mkdirp(configModule.get().plugins['music-bot'].library ? configModule.get().plugins['music-bot'].library + '/youtube' : (os.platform() === 'win32' ? 'C:/Windows/Temp/youtube' : '/tmp/youtube'), error => {
            if (error) {
                console.error(error);
                bot.sendMessage({
                    to: channelID,
                    message: 'There was a problem with downloading the video. Check out terminal of the bot to get more information.',
                });
                return false;
            }

            // Check if already downloaded
            fs.access((configModule.get().plugins['music-bot'].library ? configModule.get().plugins['music-bot'].library + '/youtube' : (os.platform() === 'win32' ? 'C:/Windows/Temp/youtube' : '/tmp/youtube')) + '/' + videoInfo.videoId + '.mp3', fs.F_OK, error => {
                if (error) {
                    bot.sendMessage({
                        to: channelID,
                        message: 'Downloading the requested video ...',
                    });

                    downloadQueue['yt:' + videoInfo.videoId] = {
                        channelID,
                    };

                    // Download the requested song
                    YD.download(videoInfo.videoId, videoInfo.videoId + '.mp3');
                } else {
                    // Add the song to the playlist
                    playlist.push({
                        youtubeID: videoInfo.videoId,
                        url: videoInfo.url,
                        title: videoInfo.title,
                        file: configModule.get().plugins['music-bot'].library + '/youtube/' + videoInfo.videoId + '.mp3',
                    });

                    bot.sendMessage({
                        to: channelID,
                        message: '`' + videoInfo.title + '` added to the playlist. Position: ' + playlist.length,
                    });
                }
            });
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
    // Check if the bot is in a voice channel
    if (voiceChannelID) {
        if (usersWantToSkip.indexOf(userID) === -1) {
            usersWantToSkip.push(userID);
        }

        const skipLimit = configModule.get().plugins['music-bot'].skipLimit ? configModule.get().plugins['music-bot'].skipLimit : 1;
        if (usersWantToSkip.length >= skipLimit) {
            bot.getAudioContext({channel: voiceChannelID, stereo: true}, stream => {
                stream.stopAudioFile();
                currentSong = null;
                bot.setPresence({
                    game: null,
                });

                setTimeout(() => {
                    playLoop(channelID);
                }, 2000);
            });
        } else {
            bot.sendMessage({
                to: channelID,
                message: 'You need ' + (skipLimit - usersWantToSkip.length) + ' more to skip the current song.',
            });
        }
    } else {
        bot.sendMessage({
            to: channelID,
            message: 'The bot is not in a voice channel.',
        });
    }
}

function leave() {
    // if (bot.servers[configModule.get().serverID].members[bot.id].voice_channel_id) {
    //     bot.leaveVoiceChannel(bot.servers[configModule.get().serverID].members[bot.id].voice_channel_id);
    // }

    // Leaves every voice channel.
    // It's needed to loop over all channels, because after a reconnect the previous voice channel is unknown
    for (let voiceChannelID in bot.servers[configModule.get().serverID].channels) {
        if (bot.servers[configModule.get().serverID].channels.hasOwnProperty(voiceChannelID)) {
            if (bot.servers[configModule.get().serverID].channels[voiceChannelID].type === 'voice') {
                bot.leaveVoiceChannel(voiceChannelID);
            }
        }
    }
}

function enter(message, isID, callback) {
    if (isID) {
        leave();
        bot.joinVoiceChannel(message);
        return true;
    }

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
        callback();
    } else {
        leave();
        bot.joinVoiceChannel(voiceChannelID);
    }
}

bot.on('ready', () => {
    if (configModule.get().plugins['music-bot'].autoJoinVoiceChannel && configModule.get().plugins['music-bot'].autoJoinVoiceChannel.length > 0) {
        enter(configModule.get().plugins['music-bot'].autoJoinVoiceChannel, false, () => {
            console.log(chalk.red('The voice channel defined in autoJoinVoiceChannel could not be found.'));
        });
    }
});

function enterCommand(user, userID, channelID, message) {
    let isID = false;
    if (
        message.length < 1
        && bot.servers[configModule.get().serverID].members[userID].voice_channel_id
    ) {
        isID = true;
        message = bot.servers[configModule.get().serverID].members[userID].voice_channel_id;
    } else if (message.length < 1) {
        bot.sendMessage({
            to: channelID,
            message: 'You have to add the channel name which the bot should join.',
        });
        return false;
    }

    enter(message, isID, () => {
        bot.sendMessage({
            to: channelID,
            message: 'There is no channel named ' + message + '.',
        });
    });
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
    events.emit('stop music');
    bot.getAudioContext({channel: voiceChannelID, stereo: true}, stream => {
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
            synonyms: [
                'new',
            ],
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
            synonyms: [
                'join',
            ],
        },
        play: {
            fn: playCommand,
            description: 'Starts the playlist',
            synonyms: [
                'start',
            ],
        },
        stop: {
            fn: stopCommand,
            description: 'Stops the playlist',
        },
        current: {
            fn: currentCommand,
            description: 'Displays the current song',
            synonyms: [
                'now',
            ],
        },
        playlist: {
            fn: playlistCommand,
            description: 'Displays all songs on the playlist',
        },
    },
};

export default plugin;
