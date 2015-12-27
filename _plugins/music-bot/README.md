Install
---
1. Copy the plugin to the `_plugins` directory.
2. Run `npm install` in the plugin directory itself
3. Configure the plugin by adding [config code](#config) to the `config.json`
4. Add it to the top of the `index.js` file in the root directory

Commands
---
* `!music add <YouTube link>` - Adds a song to the playlist (currently only YouTube supported)
    + Example: `!music add https://www.youtube.com/watch?v=iyqfHvoUtkU`
* `!music remove <YouTube link>` - Removes a song to the playlist
    + Example: `!music remove https://www.youtube.com/watch?v=iyqfHvoUtkU`
* `!music skip` - Skips the current song
* `!music play` - Starts the playlist
* `!music stop` - Stops the playlist
* `!music current` - Displays the current song
* `!music playlist` - Displays all songs on the playlist
* `!music enter <Channel name>` - Let the bot enter a voice channel (`music-bot:enter` permission required)
    + Example: `!music enter General`

Config
---
You can set your custom command prefix of this plugin by changing the `commandPrefix` line below:

```json
"plugins": {
    "music-bot": {
        "commandPrefix": "custom-command-prefix"
    }
}
```
