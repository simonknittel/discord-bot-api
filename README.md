Discord Bot API
===
This bot is basically a API for plugins such as a music bot or a raffle bot. You only have to add or develop your own plugins. You do not need to care about the command listening, discord instance initialization etc.

Installing
---
1. Clone this repository with `git clone <the url of this repository>` or download it manually
2. Make sure you have installed the latest version of [Node](https://nodejs.org/en/)
3. Make sure you have [FFmpeg](https://www.ffmpeg.org/) installed and available in your PATH variable
4. Install all dependencies by running `npm install`
5. Duplicate the [config-sample.json](./config-sample.json) and rename it to `config.json`
6. Edit `config.json` to your needs
    * Visit https://github.com/simonknittel/discord-bot-api/wiki/config.json-explained for more information

Start
---
1. Start the bot by running `npm start`

Add plugins
---
1. Copy your plugin to the [_plugins](./_plugins) directory
2. Follow the install instructions of the plugin
3. Add it to the top of the [index.js](./index.js) file

Update your bot
---
The bot will notify the owner if there is a new version available. It will check the version on the start and every 60 minutes after that.

1. Download the latest version from https://github.com/simonknittel/discord-bot-api

OR

1. Make sure you have Git installed and the url of the repository added as origin
2. Run `git pull origin master`

Develop your own plugin
---
Visit https://github.com/simonknittel/discord-bot-api/wiki/Develop-your-own-plugin

Available plugins
---
Contact me to get your plugins listed here.

* [Music bot](./_plugins/music-bot) (enabled by default)
    + This bot will currently download the requested songs to the directory where the bot is running.
    + Visit the [README.md](./_plugins/music-bot/README.md) for the commands, install instructions and more.

General commands
---

* `!commands` - Shows all available commands including the commands of the plugins
* `!about` - Shows a short description of the bot
* `!kill` - Stops the bot (`general:kill`permission required)
* `!userid` - Displays the ID of the user
* `!config` - Change the config until the next restart (`general:config` permission required)
    + Example: `!config credentials.name The Best Bot` Changes the name of the bot to `The Best Bot`

Planned features
---
Visit https://github.com/simonknittel/discord-bot-api/issues?q=is%3Aopen+is%3Aissue+label%3Aenhancement
