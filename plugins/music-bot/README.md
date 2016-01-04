Install
---
1. Copy the plugin to the `_plugins` directory.
2. Run `npm install` in the directory of the plugin
3. Start up your bot and enable the plugin with `!enable music-bot`

Commands
---
* `!music add <link>` - Adds a song to the playlist (currently only YouTube supported)
    + Example: `!music add https://www.youtube.com/watch?v=iyqfHvoUtkU`
* `!music remove <link>` - Removes a song to the playlist
    + Example: `!music remove https://www.youtube.com/watch?v=iyqfHvoUtkU`
* `!music skip` - Skips the current song
* `!music play` - Starts the playlist
* `!music stop` - Stops the playlist
* `!music current` - Displays the current song
* `!music playlist` - Displays all songs on the playlist
* `!music enter <Channel name>` - Let the bot enter a voice channel
    + Example: `!music enter General`

Config
---
You can configure the `music-bot` by extending your `config.json` with the following:

With `commandPrefix` you can set a custom command prefix for this plugin (optional). It defaults to `music`  
With `library` you can define where the songs should be downloaded to.  
With `skipLimit` you can define how many users you need to skip the current song (optional). It defaults to `1`  
With `announceSongs` you can enable or disable the announcing of the current song (optional). It defaults to `true`  
With `autoJoinVoiceChannel` you can define a voice channel which the bot trys to enter when it starts up.

Example
---
```json
"plugins": {
    "music-bot": {
        "commandPrefix": "custom-command-prefix",
        "library": "../music",
        "skipLimit": 1,
        "announceSongs": true,
        "autoJoinVoiceChannel": "Channel name"
    }
}
```

Need help?
---
Join my Discord server: https://discord.gg/0jV29zKlvdJbDx3f

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
