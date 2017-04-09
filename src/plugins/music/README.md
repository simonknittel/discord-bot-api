# music plugin

## Enable
1. Add the name of the plugin to the `plugins` array of the `config.cson` (see [below](#example) for an example)

<!--
## Install
1. Make sure you have [FFmpeg](https://ffmpeg.org) installed and available in your PATH variable or configure in your config.cson
2. Copy the plugin to the `plugins` directory.
3. Run `npm install` in the directory of the plugin
4. Start your bot and enable the plugin with `!enable music`
 -->

## Commands
* `!music add <link>` - Adds a song to the playlist
    + Currently only YouTube supported
    + Example: `!music add https://www.youtube.com/watch?v=iyqfHvoUtkU`
    + Synonyms: `!music new <link>`
* `!music remove <Position on the playlist>` - Removes a song from the playlist
    + Example: `!music remove 1`
    + Synonyms: `!music rm`, `!music delete`
* `!music skip` - Skips the current song
* `!music play` - Starts the playlist
    + Synonyms: `!music start`
* `!music stop` - Stops the playlist
* `!music current` - Displays the current song
    + Synonyms: `!music now`
* `!music playlist` - Displays all songs on the playlist
    + Synonyms: `!music queue`
* `!music join <Channel name>` - Lets the bot enter a voice channel.
    + If you leave the channel name empty, it will join your current voice channel
    + Example: `!music join General`
    + Synonyms: `!music enter <Channel name>`

## Config
You can configure the `music` by extending your `config.cson` with the following:

* `commandPrefix` With this you can set a custom command prefix for this plugin.
    + Optional
    + Default: `music`  
* `library` With this you can define where the songs should be downloaded to.
    + Optional
    + Default: `C:/Windows/Temp` (Windows) or `/tmp` (Unix)  
* `skipLimit` With this you can define how many users you need to skip the current song.
    + Optional
    + Default: `1`
* `announceSongs` With this you can enable or disable the announcing of the current song.
    + Optional
    + Default: `true`
* `autoJoinVoiceChannel` With this you can define a voice channel which the bot trys to join when it starts.
    + Optional
* `maxLength` With this you can define what should be the max length (in minutes!) of a song.
    + If set to `0` there will be no limit.
    + Numbers with decimals will be rounden up.
    + Optional
    + Default: `15`

## Example
```cson
plugins:
    music:
        commandPrefix: "music",
        library: "../music",
        skipLimit: 1,
        announceSongs: true,
        autoJoinVoiceChannel: "General",
        maxLength: 15
```

## Need help?
Join my Discord server: https://discord.gg/0jV29zKlvdJbDx3f

## License
Copyright (C) 2017 Simon Knittel (<hallo@simonknittel.de>)

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
