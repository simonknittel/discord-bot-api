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

const libraryPath = configModule.get().plugins['music-bot'].library ? configModule.get().plugins['music-bot'].library + '/youtube' : (os.platform() === 'win32' ? 'C:/Windows/Temp/discord-bot-api/youtube' : '/tmp/discord-bot-api/youtube');

let youtubeOptions = {
    outputPath: libraryPath,
    queueParallelism: 10,
};

if (configModule.get().plugins['music-bot'].ffmpeg) youtubeOptions.ffmpegPath = configModule.get().plugins['music-bot'].ffmpeg;

let YD = new YoutubeMp3Downloader(youtubeOptions);

events.on('config reloaded', () => {
    if (configModule.get().plugins['music-bot'].ffmpeg) youtubeOptions.ffmpegPath = configModule.get().plugins['music-bot'].ffmpeg;
    YD = new YoutubeMp3Downloader(youtubeOptions);
});

let playlist = []; // All requested songs will be saved in this array
let voiceChannelID = null; // The ID of the voice channel the bot has entered will be saved in this variable
let currentSong = null; // The current song will be saved in this variable
let downloadQueue = {};
let usersWantToSkip = []; // The id of the users that want to skip the current song will be stored in this array
let currentStream = null;

let disableLiveDownloadProgress = true; // Because of rate limiting

let finishedListener = function() { // Wrapper lets this function called only once (because of the weird event emits from the YouTube download library)
    finishedListener = function() {};

    YD.on('finished', (error, data) => {
        // Add the song to the playlist
        playlist.push({
            rawVideoInfo: data,
            file: data.file,
        });

        bot.editMessage({
            channelID: downloadQueue['yt:' + data.videoId].channelID,
            messageID: downloadQueue['yt:' + data.videoId].messageID,
            message: '💾 Downloaded the requested video.',
        }, (error) => {
            if (error) {
                console.log(chalk.red(error));
                console.log(error);
                console.log(''); // Empty line
            }
        });

        bot.sendMessage({
            to: downloadQueue['yt:' + data.videoId].channelID,
            message: '✅ `' + data.videoTitle + '` added to the playlist. Position: ' + playlist.length,
        });

        delete downloadQueue['yt:' + data.videoId];
    });
}

let errorListener = function() { // Wrapper lets this function called only once (because of the weird event emits from the YouTube download library)
    errorListener = function() {};

    YD.on('error', (error) => {
        console.log(chalk.red(error));
        console.log(error);
        console.log(''); // Empty line
        return false;

        // bot.sendMessage({
        //     to: downloadQueue['yt:' + error.videoId].channelID,
        //     message: '⛔ The download of <' + error.youtubeURL + '> failed. Check out terminal of the bot to get more information.',
        // });
        // delete downloadQueue['yt:' + error.videoId];
    });
}

// Live updates of the `Downloading the requested video ...` message
let liveProgress = function() { // Wrapper lets this function called only once (because of the weird event emits from the YouTube download library)
    liveProgress = function() {};

    YD.on('progress', (data) => {
        if (downloadQueue['yt:' + data.videoId] && downloadQueue['yt:' + data.videoId].noLiveProgress === false) {
            bot.editMessage({
                channelID: downloadQueue['yt:' + data.videoId].channelID,
                messageID: downloadQueue['yt:' + data.videoId].messageID,
                message: Math.floor(data.progress.percentage) === 100 ? '💾 Downloaded the requested video.' : '💾 Downloading the requested video (' + Math.floor(data.progress.percentage) + '%) ... ',
            }, (error) => {
                if (error) {
                    console.log(chalk.red(error));
                    console.log(error);
                    console.log(''); // Empty line
                    return false;
                }
            });
        }
    });
}

// Iterate through the playlist until there are no songs anymore
function playLoop(channelID) {
    // Check if the bot is in a voice channel
    if (voiceChannelID) {
        if (playlist.length < 1) {
            bot.sendMessage({
                to: channelID,
                message: 'The playlist is empty.',
            });
            return false;
        }

        if (currentSong !== null) currentSong.unpipe();
        const nextSong = playlist[0]; // Get the first song of the playlist
        playlist.shift(); // Removes the now playing song from the playlist
        currentSong = nextSong;
        usersWantToSkip = [];
        bot.setPresence({
            game: {
                name: '🎶 ' + nextSong.rawVideoInfo.title,
            },
        });

        const announceSongs = configModule.get().plugins['music-bot'].announceSongs === false ? false : true;
        if (announceSongs) {
            bot.sendMessage({
                to: channelID,
                message: '🎶 Now playing: `' + nextSong.rawVideoInfo.title + '`',
            });
        }

        bot.getAudioContext(voiceChannelID, (error, stream) => {
            currentStream = fs.createReadStream(currentSong.file);
            currentStream.pipe(stream, {end: false});

            stream.once('done', function() {
                if (!currentSong) return false;

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
            message: '⛔ The bot is not in a voice channel.',
        });
    }
}

function extractYouTubeID(url, channelID) {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const matches = url.match(regExp);
    if (matches && matches[2].length === 11) return matches[2];

    bot.sendMessage({
        to: channelID,
        message: '⛔ This seems to be an invalid link.',
    });
    return false;
}

function addCommand(user, userID, channelID, message) {
    // Get the URL from the message (it should be the first element after the command)
    const urls = message.trim().split(' ');
    const multiple = urls.length > 1;

    if (urls.length < 1) {
        bot.sendMessage({
            to: channelID,
            message: '⛔ You have to add at least one link to your command.',
        });

        return false;
    }

     // Parse multiple URLs at once
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];

        // Add timeout to get no 403 error from the YouTube servers
        setTimeout(() => {
            // Extract YouTube ID
            const youtubeID = extractYouTubeID(url, channelID);
            if (!youtubeID) return false;

            // Fetch meta data from YouTube video
            fetchVideoInfo(youtubeID, (error, videoInfo) => {
                if (error) {
                    console.error(error, youtubeID);
                    bot.sendMessage({
                        to: channelID,
                        message: '⛔ This seems to be an invalid link.',
                    });
                    return false;
                }

                // Check length of video
                let maxLength = configModule.get().plugins['music-bot'].maxLength;
                if (maxLength && isNaN(maxLength)) {
                    console.log(chalk.styles.red.open + 'The max length of a song defined in your "config.json" is invalid. Therefore the download of ' + chalk.styles.red.close + videoInfo.url + chalk.styles.red.open + ' will be stopped.' + chalk.styles.red.close);
                    bot.sendMessage({
                        to: channelID,
                        message: '⛔ The max length of a song defined in your "config.json" is invalid. Therefore the download will be stopped.',
                    });
                    return false;
                } else if (Math.ceil(maxLength) === 0) {

                } else if (videoInfo.duration / 60 > Math.ceil(maxLength)) {
                    bot.sendMessage({
                        to: channelID,
                        message: '⛔ The video is too long. Only videos up to ' + Math.round(maxLength) + ' minutes are allowed.',
                    });
                    return false;
                } else if (videoInfo.duration / 60 > 15) {
                    bot.sendMessage({
                        to: channelID,
                        message: '⛔ The video is too long. Only videos up to 15 minutes are allowed.',
                    });
                    return false;
                }

                // Create download directory
                mkdirp(libraryPath, (error) => {
                    if (error) {
                        console.log(chalk.red(error));
                        console.log(error);
                        console.log(''); // Empty line

                        bot.sendMessage({
                            to: channelID,
                            message: '⛔ There was a problem with downloading the video. Check out terminal of the bot to get more information.',
                        });

                        return false;
                    }

                    // Check if already downloaded
                    const filePath = libraryPath + '/' + videoInfo.videoId + '.mp3';
                    fs.access(filePath, fs.F_OK, (error) => {
                        if (error) { // File not already downloaded
                            const message = disableLiveDownloadProgress !== true && multiple ? '💾 Downloading the requested video' + (multiple ? '' : ' (0%)') + ' ...' : '💾 Downloading the requested video ...';

                            bot.sendMessage({
                                to: channelID,
                                message: message,
                            }, (error, response) => {
                                if (error) {
                                    console.log(chalk.red(error));
                                    console.log(error);
                                    console.log(''); // Empty line
                                }

                                downloadQueue['yt:' + videoInfo.videoId] = {
                                    channelID,
                                    messageID: response.id,
                                    noLiveProgress: multiple,
                                };

                                // Download the requested song
                                YD.download(videoInfo.videoId, videoInfo.videoId + '.mp3');
                                finishedListener();
                                errorListener();
                                if (disableLiveDownloadProgress !== true) liveProgress();
                            });
                        } else { // Already downloaded
                            // Add the song to the playlist
                            playlist.push({
                                rawVideoInfo: videoInfo,
                                file: filePath,
                            });

                            bot.sendMessage({
                                to: channelID,
                                message: '✅ `' + videoInfo.title + '` added to the playlist. Position: ' + playlist.length,
                            }, (error) => {
                                if (error) {
                                    console.log(chalk.red(error));
                                    console.log(error);
                                    console.log(''); // Empty line
                                }
                            });
                        }
                    });
                });
            });
        }, 1000 * i);
    }
}

function removeCommand(user, userID, channelID, message) {
    const url = message.split(' ')[0];

    if (url.length < 1) {
        bot.sendMessage({
            to: channelID,
            message: '⛔ You have to add a link to your command.',
        });

        return false;
    }

    // Extract YouTube ID
    const youtubeID = extractYouTubeID(url, channelID);
    if (!youtubeID) return false;

    playlist = playlist.filter(element => element.youtubeID !== youtubeID);

    bot.sendMessage({
        to: channelID,
        message: '✅ Successfully removed from the playlist.',
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
            currentStream.unpipe();
            currentSong = null;
            bot.setPresence({
                game: null,
            });

            setTimeout(() => {
                playLoop(channelID);
            }, 2000);
        } else {
            bot.sendMessage({
                to: channelID,
                message: '⛔ You need ' + (skipLimit - usersWantToSkip.length) + ' more to skip the current song.',
            });
        }
    } else {
        bot.sendMessage({
            to: channelID,
            message: '⛔ The bot is not in a voice channel.',
        });
    }
}

// Leaves every voice channel.
function leave() {
    // It's needed to loop over all channels, because after a reconnect the previous voice channel is unknown
    for (const channelID in bot.channels) {
        if (bot.channels[channelID].type === 'voice') {
            bot.leaveVoiceChannel(channelID);
        }
    }
}

function enter(message, isID, callback) {
    leave();

    if (isID) {
        bot.joinVoiceChannel(message);
        voiceChannelID = message;
        return true;
    }

    let notFound = true;
    // Look for the ID of the requested channel
    for (const channelID in bot.channels) {
        if (bot.channels[channelID].name === message && bot.channels[channelID].type === 'voice') {
            voiceChannelID = channelID;
            notFound = false;
        }
    }

    if (notFound) {
        callback();
        return false;
    }

    bot.joinVoiceChannel(voiceChannelID);
    return true;
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
            message: '⛔ You have to add the channel name which the bot should join.',
        });
        return false;
    }

    enter(message, isID, () => {
        bot.sendMessage({
            to: channelID,
            message: '⛔ There is no channel named ' + message + '.',
        });
    });
}

function playCommand(user, userID, channelID) {
    if (!voiceChannelID) {
        bot.sendMessage({
            to: channelID,
            message: '⛔ The bot is not in a voice channel.',
        });
    } else if (playlist.length <= 0) {
        bot.sendMessage({
            to: channelID,
            message: '⛔ There are currently no entries on the playlist.',
        });
    } else {
        playLoop(channelID);
    }
}

function stopCommand() {
    events.emit('stop music');
    currentStream.unpipe();
    currentSong = null;
    bot.setPresence({
        game: null,
    });
}

function currentCommand(user, userID, channelID) {
    // Check if a song is playing
    if (currentSong) {
        bot.sendMessage({
            to: channelID,
            message: '🎶 Currently playing: ' + currentSong.rawVideoInfo.url,
        });
    } else {
        bot.sendMessage({
            to: channelID,
            message: '⛔ There is currently nothing playing.',
        });
    }
}

function playlistCommand(user, userID, channelID) {
    // Check if there are songs on the playlist
    if (playlist.length < 1) {
        bot.sendMessage({
            to: channelID,
            message: '⛔ There are currently no entries on the playlist.',
        });
    } else {
        let string = '';
        let duration = 0;
        for (var i = 0; i < playlist.length; i++) {
            string += (i + 1) + '. ' + playlist[i].rawVideoInfo.title + "\r\n";
            duration += playlist[i].rawVideoInfo.duration;
        }

        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration - (hours * 3600)) / 60);
        const seconds = Math.floor(duration % 60);
        const durationString = (hours < 10 ? '0' + hours : hours)
            + ':' + (minutes < 10 ? '0' + minutes : minutes)
            + ':' + (seconds < 10 ? '0' + seconds : seconds);

        string = '```' + playlist.length + ' songs / ' + durationString + ' duration' + "\r\n" + "\r\n" + string + '```';

        bot.sendMessage({
            to: channelID,
            message: '🎶 Current playlist:' + "\r\n" + string,
        });
    }
}

let plugin = {
    name: 'music-bot',
    defaultCommandPrefix: 'music',
    commands: {
        add: {
            fn: addCommand,
            description: 'Adds a song to the playlist (separate multiple links with a space)',
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
        leave: {
            fn: leave,
            description: 'Leaves the bots current voice channel',
            synonyms: [
                'exit',
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
