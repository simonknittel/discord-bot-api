Discord Bot
===

Starting the bot
---
1. Make sure you have installed the latest version of [Node](https://nodejs.org/en/)
2. Install all dependencies by running `npm install`
3. Duplicate the `config-sample.json` and rename it to `config.json`
4. Edit `config.json` to your needs
5. Start the bot by running `npm start`

Add plugins
---
1. Copy your plugin to the [_plugins](./_plugins) directory
1. Add it to the top of the [index.js](./index.js) file

Update your bot
---
1. Make sure you have Git installed
2. Run `git pull origin master`

OR

1. Download the latest version from https://github.com/simonknittel/discord-bot

Commands
---

### General
* `!commands` - Shows all available commands
* `!about` - Shows the version, description and contributors of the bot
* `!rename` - Renames the bot
* `!kill` - Stops the bot
* `!userid` - Displays the ID of the user

### Music player
* `!add <YouTube link>` - Adds a song to the playlist
* `!remove <YouTube link>` - Removes a song to the playlist
* `!skip` - Skips the current song
* `!play` - Starts the playlist
* `!stop` - Stops the playlist
* `!current` - Displays the current song
* `!playlist` - Displays all songs on the playlist
* `!enter <Channel name>` - Let the bot enter a voice channel

Planned features
---

### Raffle
* `!create` - Creates a new raffle
* `!start` - Starts the raffle and opens it for participants
* `!join` - Join the raffle
* `!leave` - Leave the raffle
* `!list` - Lists all participants
* `!draw` - Closes the raffle and draws the winner

### Announcements
