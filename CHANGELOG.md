v0.6.6
===
Download here: https://github.com/simonknittel/discord-bot-api/releases/tag/v0.6.6

Important changes
---
* There is a new [CHANGELOG.md](./CHANGELOG.md) file which shows you important changes and what changes for you.

v0.6.5
===
Download here: https://github.com/simonknittel/discord-bot-api/releases/tag/v0.6.5

Important changes
---

* You do not have to add plugins to the top of the [plugins.js](./_modules/plugin.js) anymore to enable them. You have to enable them in your `config.json` now. You have to give them at least an empty object like `"music-bot": {}`. Example:

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

v0.6.4
===
Download here: https://github.com/simonknittel/discord-bot-api/releases/tag/v0.6.4

Important changes
---
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

v0.6.3
===
Download here: https://github.com/simonknittel/discord-bot-api/releases/tag/v0.6.3

Important changes
---
* The bot can auto accept invites defined in your `config.json` now. Example:
```json
"invites": [
    "your invite link here"
]
```

Changes
---
* Added some more error logging
