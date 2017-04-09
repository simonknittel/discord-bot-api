// Discord Bot API
import configModule from '../../modules/config';
import bot from '../../modules/bot';
import events from '../../modules/events';

// Other
import fetchVideoInfo from 'youtube-info';
import mkdirp from 'mkdirp';
import YoutubeMp3Downloader from 'youtube-mp3-downloader';
import fs from 'fs';
import chalk from 'chalk';
import os from 'os';


const libraryPath = configModule.get().plugins.music.library ? configModule.get().plugins.music.library + '/youtube' : (os.platform() === 'win32' ? 'C:/Windows/Temp/discord-bot-api/youtube' : '/tmp/discord-bot-api/youtube');

const youtubeOptions = {
    outputPath: libraryPath,
    queueParallelism: 10,
};

if (configModule.get().plugins.music.ffmpeg) youtubeOptions.ffmpegPath = configModule.get().plugins.music.ffmpeg;


let YD = new YoutubeMp3Downloader(youtubeOptions);

events.on('config reloaded', () => {
    if (configModule.get().plugins.music.ffmpeg) youtubeOptions.ffmpegPath = configModule.get().plugins.music.ffmpeg;
    YD = new YoutubeMp3Downloader(youtubeOptions);
});

const playlist = []; // All requested songs will be saved in this array
let voiceChannelID = null; // The ID of the voice channel the bot has entered will be saved in this variable
let currentSong = null; // The current song will be saved in this variable
const downloadQueue = {};
let usersWantToSkip = []; // The id of the users that want to skip the current song will be stored in this array
let currentStream = null;

let disableLiveDownloadProgress = true; // Because of rate limiting

let finishedListener = function() { // Wrapper lets this function called only once (because of the weird event emits from the YouTube download library)
    finishedListener = function() {};

    YD.on('finished', (error, data) => {
        if (configModule.get().debug) {
            console.log(
                chalk.yellow('DEBUG:'),
                chalk.blue('YD.on(\'finished\', () => {});')
            );
            console.log(''); // Empty line
        }

        // Add the song to the playlist
        playlist.push({
            rawVideoInfo: data,
            file: data.file,
        });

        bot.editMessage({
            channelID: downloadQueue['yt:' + data.videoId].channelID,
            messageID: downloadQueue['yt:' + data.videoId].messageID,
            message: '💾 Downloaded the requested video.',
        }, error => {
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

    YD.on('error', error => {
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
            }, error => {
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

/**
 * Iterate through the playlist until there are no songs anymore
 * @method playLoop
 * @param  {String} channelID The ID of the channel were the song was requested
 * @return {Void}             Returns nothing
 */
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
                name: '🎶 ' + nextSong.rawVideoInfo.videoTitle,
            },
        });

        const announceSongs = configModule.get().plugins.music.announceSongs === false ? false : true;
        if (announceSongs) {
            bot.sendMessage({
                to: channelID,
                message: '🎶 Now playing: `' + nextSong.rawVideoInfo.videoTitle + '`',
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
                let maxLength = configModule.get().plugins.music.maxLength;
                if (maxLength && isNaN(maxLength)) {
                    console.log(chalk.red('The max length of a song defined in your "config.cson" is invalid. Therefore the download of ') + videoInfo.url + chalk.red(' will be stopped.'));
                    bot.sendMessage({
                        to: channelID,
                        message: '⛔ The max length of a song defined in your "config.cson" is invalid. Therefore the download will be stopped.',
                    });
                    return false;
                } else if (Math.ceil(maxLength) === 0) {

                } else if (videoInfo.duration / 60 > Math.ceil(maxLength)) {
                    bot.sendMessage({
                        to: channelID,
                        message: `⛔ The video is too long. Only videos up to ${Math.round(maxLength)} minutes are allowed.`,
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
                mkdirp(libraryPath, error => {
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
                    fs.access(filePath, fs.F_OK, error => {
                        if (error) { // File not already downloaded
                            const message = disableLiveDownloadProgress !== true && multiple ? `💾 Downloading the requested video${multiple ? '' : ' (0%)'} ...` : '💾 Downloading the requested video ...';

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
                            }, error => {
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
    const itemsToRemove = message.split(' ');

    if (itemsToRemove.length < 1) {
        bot.sendMessage({
            to: channelID,
            message: '⛔ You have to add atleast one songs to your command.',
        });

        return false;
    }

    let removedItems = [];

    for (const index of itemsToRemove) {
        if (index < 1 || index > itemsToRemove.length) continue;

        removedItems.push(index + '. ' + playlist[index - 1].rawVideoInfo.videoTitle + "\r\n");
        playlist.splice(index - 1, 1);
    }

    if (removedItems.length < 1) {
        bot.sendMessage({
            to: channelID,
            message: '⛔ No songs removed.',
        });

        return true;
    }

    bot.sendMessage({
        to: channelID,
        message: '✅ Songs removed from the playlist:' + "\r\n" + '```' + removedItems.join('') + '```',
    });
}

function skipCommand(user, userID, channelID) {
    // Check if the bot is in a voice channel
    if (voiceChannelID) {
        if (usersWantToSkip.indexOf(userID) === -1) usersWantToSkip.push(userID);

        const skipLimit = configModule.get().plugins.music.skipLimit ? configModule.get().plugins.music.skipLimit : 1;
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
                message: `⛔ You need ${skipLimit - usersWantToSkip.length} more to skip the current song.`,
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
    if (currentStream !== null) stopCommand();

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
        if (bot.channels[channelID].name.toLowerCase() === message.toLowerCase() && bot.channels[channelID].type === 'voice') {
            voiceChannelID = channelID;
            notFound = false;
        }
    }

    if (notFound) {
        callback();
        return false;
    }

    bot.joinVoiceChannel(voiceChannelID, (error, events) => {
        // Implementaion for issue #53
        // events.on('speaking', (userID, SSRC, speakingBool) => {
        //     // Ignore the bots own events
        //     if (userID === bot.id) return false;
        //
        //     // Check if speaking user is in the same channel
        //     if (!bot.channels[voiceChannelID].members[userID]) return false;
        //
        //     // Reduce the volume
        //     if (speakingBool) { // Started speaking
        //         console.log('started');
        //     } else { // Stopped speaking
        //         console.log('stopped');
        //     }
        // });
    });

    return true;
}

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
            message: `⛔ There is no channel named ${message}.`,
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
            message: `🎶 Currently playing: ${currentSong.rawVideoInfo.url}`,
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
            string += (i + 1) + '. ' + playlist[i].rawVideoInfo.videoTitle + "\r\n";
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


bot.on('ready', () => {
    if (configModule.get().plugins.music.autoJoinVoiceChannel && configModule.get().plugins.music.autoJoinVoiceChannel.length > 0) {
        enter(configModule.get().plugins.music.autoJoinVoiceChannel, false, () => {
            console.log(chalk.red('The voice channel defined in autoJoinVoiceChannel could not be found.'));
        });
    }
});


const plugin = {
    name: 'music',
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
            synonyms: [
                'rm',
                'delete',
            ],
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
            synonyms: [
                'queue',
            ],
        },
    },
};

export default plugin;
