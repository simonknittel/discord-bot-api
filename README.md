Discord Bot API
===
This bot is basically a API for plugins such as a music bot or a raffle bot. You only have to add or develop your own plugins.

Installing
---
1. Clone this repository with `git clone <the url of this repository>` or download it manually
2. Make sure you have installed the latest version of [Node](https://nodejs.org/en/)
3. Make sure you have [FFmpeg](https://www.ffmpeg.org/) installed and available in your PATH variable
4. Install all dependencies by running `npm install`
5. Duplicate the `config-sample.json` and rename it to `config.json`
6. Edit `config.json` to your needs (visit https://github.com/simonknittel/discord-bot-api/wiki/config.json-explained for more information)

Start
---
1. Start the bot by running `npm start`

Add plugins
---
1. Copy your plugin to the [_plugins](./_plugins) directory
2. Add it to the top of the [index.js](./index.js) file

Update your bot
---
The bot will notify the owner if there is a new version available. It will check the version on the start and every 60 minutes after that.

1. Download the latest version from https://github.com/simonknittel/discord-bot-api

OR

1. Make sure you have Git installed and the url of the repository added as origin
2. Run `git pull origin master`

Develop your own plugin
---
Visit this wiki page https://github.com/simonknittel/discord-bot-api/wiki/Develop-your-own-plugin

Available plugins
---
Contact me to get your plugins listed here.

* [Music bot](./_plugins/music-bot) (enabled by default)
    + This bot will currently download the requested songs to the directory where the bot is running.
    + `!add <YouTube link>` - Adds a song to the playlist (Example: `!add https://www.youtube.com/watch?v=iyqfHvoUtkU`)
    + `!remove <YouTube link>` - Removes a song to the playlist (Example: `!remove https://www.youtube.com/watch?v=iyqfHvoUtkU`)
    + `!skip` - Skips the current song
    + `!play` - Starts the playlist
    + `!stop` - Stops the playlist
    + `!current` - Displays the current song
    + `!playlist` - Displays all songs on the playlist
    + `!enter <Channel name>` - Let the bot enter a voice channel (Example: `!enter General`)

General
---

* `!commands` - Shows all available commands
* `!about` - Shows a short description of the bot
* `!rename <New name>` - Renames the bot (Example: `!enter My Bot`)
* `!kill` - Stops the bot
* `!userid` - Displays the ID of the user

Planned features
---
Visit https://github.com/simonknittel/discord-bot-api/issues?q=is%3Aopen+is%3Aissue+label%3Aenhancement
