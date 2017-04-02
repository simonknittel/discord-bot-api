# Changelog

## v0.8.0 _not released yet_
Download here: https://github.com/simonknittel/discord-bot-api/releases/tag/v0.8.0

### Important changes
* Replaced JSON configuration file with CSON one
* Provided a Dockerfile for running the bot with Docker

### Changes
* Fix for issue #45
* Clean up
    + Updated dependencies
    + Updated install instructions
    + Updated the `config-sample.json` to provide a sample configuration that just works&trade; and utilized the defaults
    + Fixed broken stuff
    + Renamed `music-bot` plugin to `music`
    + Updated the install instructions
* **[music plugin]** Added some emojis to the messages
* **[music plugin]** Shows now some timestamps/progress states in the messages
* **[music plugin]** Added possibility to add multiple URLs at once
* **[music plugin]** Updated the `!music playlist` command with more information (closes #48)
* Better error handling, when renaming of the bot goes wrong
* Made `!op`, `!deop` and `!owner` working with mentions (closes #52)
* Relocated the documentation to the `documentation` directory to get version history for these too
* The command cooldown now doesn't affect the owner (closes #47)
* **[music plugin]** Ignores now the case sensitivity of the channel name in the `!music enter` command (closes #32)


## v0.7.9
Download here: https://github.com/simonknittel/discord-bot-api/releases/tag/v0.7.9

### Changes
* Every command can now have synonyms. The plugins can define synonyms itself, but you can also add your custom ones or disable by the plugin defined ones with your `config.json`.
    + Example:
    ```json
    "plugins": {
        "general": {
            "commands": {
                "about": {
                    "synonyms": {
                        "help": {
                            "enabled": true
                        },
                        "about": {
                            "enabled": false
                        }
                    }
                }
            }
        }
    }
    ```
* You can now add or remove multiple permissions at the same time with `!op` and `!deop`
    + Example: `!op <user id> general:kill general:reload`
* You can now give the bot an avatar with `!avatar <url or relative path>` or by setting it in your `config.json`. Setting it to `null` will remove the avatar.
    + Example:
    ```json
    {
        "credentials": {
            "avatar": "url or relative path"
        }
    }
    ```
* You can now let your bot ignore channels defined by your `config.json`.
    + Example:
    ```json
    {
        "ignoreChannels": [
            "#bot-free-channel"
        ]
    }
    ```

## v0.7.8
Download here: https://github.com/simonknittel/discord-bot-api/releases/tag/v0.7.8

### Important changes
* You don't have to require permissions anymore in your `config.json` for specific commands (defined by the plugin). Some commands will now require permissions by default. You can set it to false if they sould not require permissions. The following commands will now require permissions by default:
    + `!kill`
    + `!owner`
    + `!prefix`
    + `!op`
    + `!deop`
    + `!enable`
    + `!rename`
    + `!reload`

### Changes
* Fixed permission system

## v0.7.7
Download here: https://github.com/simonknittel/discord-bot-api/releases/tag/v0.7.7

### Changes
* You can now specify a channel which is required to request a command
    + Example:
    ```json
    "plugins": {
        "music-bot": {
            "commands": {
                "add": {
                    "channel": "#music"
                }
            }
        }
    }
    ```

## v0.7.6
Download here: https://github.com/simonknittel/discord-bot-api/releases/tag/v0.7.6

### Important changes
* **[music-bot plugin]** You can now define the max length of a song (in minutes). It defaults to `15` minutes. `0` minutes will be endless.
    + Example:
    ```json
    "plugins": {
        "music-bot": {
            "maxLength": 30
        }
    }
    ```
* Bumped the version of `discord.io` to 1.6.5
    + Run `npm install discord.io` to install the new version
* You can now define how fast (in seconds) your `config.json` will be reloaded automatically without restarting the bot (optional).It default to every 5 seconds. Settings it to `0` disables it. Example: `"reloadConfig": 10`.

### Changes
* Renamed some directories
* Added missing information to the install instruction
* Added a license
* **[music-bot plugin]** Fixed `!music stop` command (issue #33)
* Added missing commands to the [README.md](./README.md)
* Fixed directory names
* **[music-bot plugin]** You don't need to set a library anymore. It will default to the OS specific temp directories
* Disconnect the bot before killing the process. The bot should now log out everytime when using `!kill`.

## v0.7.5
Download here: https://github.com/simonknittel/discord-bot-api/releases/tag/v0.7.5

### Important changes
* Fixed issue that will check for updates in a high rate and will get blocked by the GitHub API because of that

## v0.7.4
Download here: https://github.com/simonknittel/discord-bot-api/releases/tag/v0.7.4

### Important changes
* Added `!owner <user id>` to change the owner of the bot
    + Make sure to require permissions for this in your `config.json`. In the future commands like this will require permissions by default.

### Changes
* Added `!reload` to reload your `config.json`
* Send update notifications through direct messages to the owner only once for each version

## v0.7.3
Download here: https://github.com/simonknittel/discord-bot-api/releases/tag/v0.7.3

### Important changes
* Bumped the version of `discord.io` to 1.6.3
    + Remove the `node_modules` directory and install all dependencies again with `npm install`
* Removed `!config` completely. In addition to that: Added multiple specific commands to change the `config.json`
    + `!rename <name>` Renames the bot
    + `!op <user id> <permission>` Adds a permission to a user
    + `!deop <user id> <permission>` Removes a permission from a user
    + `!prefix <new prefix>` Changes the global command prefix
    + Make sure to require permissions for them in your `config.json`. In the future commands like this will require permissions by default.

### Changes
* Removed `enablePlugin` from the `!commands` output
* On disconnect it tries now to reconnect every 1 minute, not 10

## v0.7.2
Download here: https://github.com/simonknittel/discord-bot-api/releases/tag/v0.7.2

### Important changes
* `!config` is temporarily disabled, because it does not work as expected and can overrite parts of your `config.json`

### Changes
* You can now enable plugins without having to restart with `!enable <name>`
    + Example: `!enable dice`
* [music-bot plugin] When you leave out the channel in the `!music enter Channel` command and you are in a voice channel right now, it will try to join your voice channel
* You can now give an operator a wildcard for each plugin to grant him all permissions of this plugin.
    + Example:
    ```json
    "operators": {
        "user id here": {
            "permissions": [
                "music-bot:*"
            ]
        }
    }
    ```
* Added internal event system
* The bot will now notify the owner through a direct message if a new version is available.
* The bot will now show the enabled plugins on start-up.

## v0.7.1
Download here: https://github.com/simonknittel/discord-bot-api/releases/tag/v0.7.1

### Changes
* [music-bot plugin] You can now define a channel which the bot should automatically join when started.
    + Example:
    ```json
    "plugins": {
        "music-bot": {
            "autoJoinVoiceChannel": "General"
        }
    }
    ```
* You can now give an operator a wildcard as permission to grant him all permissions.
    + Example:
    ```json
    "operators": {
        "user id here": {
            "permissions": [
                "*"
            ]
        }
    }
    ```

## v0.7.0
Download here: https://github.com/simonknittel/discord-bot-api/releases/tag/v0.7.0

### Important changes
* Bumped the version of `discord.io` to 1.6.2
    + Remove the `node_modules` directory and install all dependencies again with `npm install`

### Changes
* You can now roll a dice with the new `dice` plugin
    + Example: `!dice roll 6` Rolls a dice with 6 faces
* The music-bot plugin is playing sound again
* Removed some deprecated code

## v0.6.9
Download here: https://github.com/simonknittel/discord-bot-api/releases/tag/v0.6.9

### Changes
* Changed the style of the update notification.
* You will now get notified when required properties like the bot credentials are not set in your config.json.

## v0.6.8
Download here: https://github.com/simonknittel/discord-bot-api/releases/tag/v0.6.8

### Changes
* Removed code used for testing ...

## v0.6.7
Download here: https://github.com/simonknittel/discord-bot-api/releases/tag/v0.6.7

### Important changes
* Bumped the version of `discord.io` to 1.6.2
    + Remove the `node_modules` directory and install all dependencies again with `npm install`

### Changes
* The bot tries to reconnect now if it gets disconnected from Discord.

## v0.6.6
Download here: https://github.com/simonknittel/discord-bot-api/releases/tag/v0.6.6

### Important changes
* There is a new [CHANGELOG.md](./CHANGELOG.md) file which shows you important changes and what changes for you.

## v0.6.5

### Important changes

* You do not have to add plugins to the top of the [plugins.js](./_modules/plugin.js) anymore to enable them. You have to enable them in your `config.json` now. You have to give them at least an empty object like `"music-bot": {}`. Make sure to have `general` enabled to get the general commands like `!kill`, `!config`, `!commands`, ... Example:

```json
"plugins": {
    "general": {},
    "music-bot": {
        "library": "../music"
    }
}
```

Other changes
---
* The bot prints your version in the terminal when you start the bot.

## v0.6.4
Download here: https://github.com/simonknittel/discord-bot-api/releases/tag/v0.6.4

### Important changes
* The permission system has been reworked.
    + You have to define in your `config.json` now if a specific permission is required.
    + In addition to that every command got a default permission like `general:kill` or `music-bot:enter`.
    + Commands which do not require permissions in your `config.json` can be execuded by everybody, so make sure you add commands like `!kill` or `!config` to your `config.json`. Example:
    ```json
    "plugins": {
        "general": {
            "commands": {
                "kill": {
                    "requirePermission": true
                },
                "config": {
                    "requirePermission": true
                }
            }
        }
    }
    ```
    + Plugin developers can still ask for custom permissions with the `api.isOperator(userID, 'plugin-name:permission', channelID)` function
* The way to define operators in your `config.json` has changed a little bit. Example:
```json
"operators": {
    "user id here": {
        "permissions": [
            "general:kill"
        ]
    }
}
```

## v0.6.3

### Important changes
* The bot can auto accept invites defined in your `config.json` now. Example:
```json
"invites": [
    "your invite link here"
]
```

### Changes
* Added some more error logging
