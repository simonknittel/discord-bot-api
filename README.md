Discord Bot API
===
This bot for Discord is basically a API for plugins such as a music bot or a raffle bot. You only have to add or develop your own plugins. You do not need to care about the command listening, discord instance initialization etc.

Need help?
---
Join my Discord server: https://discord.gg/0jV29zKlvdJbDx3f  
Visit the [FAQ / Known issues](https://github.com/simonknittel/discord-bot-api/wiki/FAQ---Known-issues)  

Install
---
1. Download the latest release here: https://github.com/simonknittel/discord-bot-api/releases/latest
2. Make sure you have [Node](https://nodejs.org/en/) installed and available in your PATH variable
3. Make sure you have [FFmpeg](https://www.ffmpeg.org/) installed and available in your PATH variable
4. Make sure you have [Python](https://www.python.org/) installed and available in your PATH variable
    * Run `npm config set python python2.7`
5. **[Windows]** Make sure you have [Microsoft Visual C++ Build Tools 2015](https://www.microsoft.com/en-us/download/details.aspx?id=49983) installed
    * Run `npm config set msvs_version 2015 --global`
6. Install all dependencies by running `npm install`
7. Duplicate the [config-sample.json](./config-sample.json) and rename it to `config.json`
8. Edit `config.json` to your needs
    * Visit https://github.com/simonknittel/discord-bot-api/wiki/config.json-explained for more information

Start
---
1. Start the bot by running `npm start`

Add plugins
---
1. Follow the install instructions of the plugin

OR

1. Copy the plugin to the [plugins](./plugins) directory
2. Start up your bot and enable the plugin with `!enable <plugin>`
    * Example: `!enable dice`

Update your bot
---
The bot will notify the owner if there is a new version available. It will check the version on the start and every 60 minutes after that.

1. Download the latest release here: https://github.com/simonknittel/discord-bot-api/releases/latest
2. Copy over your old `config.json`.
    * Make sure to read the changelog for any important changes

Develop your own plugin
---
Visit https://github.com/simonknittel/discord-bot-api/wiki/Develop-your-own-plugin

Available plugins
---
Contact me to get your plugins listed here.

* [Music bot](./plugins/music-bot) (enabled by default)
    + Visit the [README.md](./plugins/music-bot/README.md) for the commands, install instructions and more.
* [Dice](./plugins/dice)
    + Visit the [README.md](./plugins/dice/README.md) for the commands, install instructions and more.

General commands
---

* `!commands` (or `!help`) - Shows all available commands including the commands of the plugins
* `!about` - Shows a short description of the bot
* `!kill` (or `!stop`) - Stops the bot
* `!userid` (or `!me`) - Displays the ID of the user
* `!enable <plugin>` - Enables a plugin without having to restart
    + Example: `!enable dice`
* `!op <user id> <permission>` - Give an user a permission
* `!deop <user id> <permission>` - Remove a permission from an user
* `!prefix <new prefix>` - Change the global command prefix
* `!owner <user id>` - Change the owner of the bot
* `!rename <new name>` - Rename the bot
* `!reload` (or `!refresh`) - Reloads the config
* `!avatar <url or relative path>` - Give the bot an avatar. Setting it to `null` will remove the avatar.

Planned features
---
Visit https://github.com/simonknittel/discord-bot-api/issues?q=is%3Aopen+is%3Aissue+label%3Aenhancement

Thanks
---
Thanks to everyone who reports me bugs, gives me feedback or tries to figure out the cause of an issues. Without them the Discord Bot API wouldn't be so cool.

License
---
Copyright (C) 2016  Simon Knittel <hallo@simonknittel.de>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
