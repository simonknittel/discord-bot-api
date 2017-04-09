# config.cson explained
```cson
credentials:
    token: "" # Add the token of your bot here
    name: "Bot - !commands" # You can give your bot here a new name and it will change when he joins your server (optional).

ownerID: "" # Add the ID of your Discord account here.This will give you the permission for some commands only the owner should be able to use.
serverID: "" # Add the ID of the server the bot should run on here

mentionRequired: false # If set to true, you have to mention the bot directly (optional).
globalCommandPrefix: "!" # Set here the prefix for all your commands (optional). It defaults to `!`
reloadConfig: 5 # Set here how fast (in seconds) your `config.cson` should be reloaded automatically without restarting the bot (optional).It default to every 5 seconds. Settings it to `0` disables it.
commandCooldown: 1000 # You can set a time in milliseconds which the user has to wait until a new command from him will be executed (optional).
ignoreChannels: [ # Here you can define which channels should be ignored by your bot. (optional)
    "#bot-free-channel"
]

operators: # You can give other users specific permissions by adding them here (optional). The object key will be the user id.
    "":
        permissions: [ # The permissions of the operator (optional). You can give the user a wildcard `*` as permission to grant him all permissions.
            "general:kill" # plugin-name:command-name
        ]

plugins: # Plugins listed here will be enabled
    general: # The name of the plugin you want to have enabled
        commands: # You can configure here each command individually
            about: # The name of the command you want to configure
                requirePermission: false # If set to true, it will require permission for this command. If set to false, it will not. If unset it will default to the plugins default.
            kill: # The name of the command you want to configure
                requirePermission: true # If set to true, it will require permission for this command. If set to false, it will not. If unset it will default to the plugins default.

    music: # The name of the plugin you want to have enabled
        commands: # You can configure here each command individually
            add: # The name of the command you want to configure
                channel: "#music"

        commandPrefix: "music" # Here you can customize the command prefix of this plugin (optional). It defaults to a prefix defined by the plugin itself.
        library: "../music"
        skipLimit: 1
        announceSongs: true
        autoJoinVoiceChannel: "General"
        maxLength: 15
```

**plugins.channel:** You can define here a text channel which the command listens to. If it's not set, it will listen to all channels.
**plugins.commands.channel** If set, the command will only work in this channel. If unset, it will work in every channel.  

The other properties listed here are plugin specific.

## Need help?
Join my Discord server: https://discord.gg/0jV29zKlvdJbDx3f
