```cson
credentials:
    name: "Bot - !commands"
    email: ""
    password: ""

ownerID: ""
serverID: ""

invites: [
    ""
]

mentionRequired: false
globalCommandPrefix: "!"
reloadConfig: 5
commandCooldown: 1000
ignoreChannels: [
    "#bot-free-channel"
]

operators:
    "":
        permissions: [
            "general:kill"
        ]

plugins:
    general:
        commands:
            about:
                requirePermission: false
            kill:
                requirePermission: true

    "music-bot":
        commands:
            add:
                channel: "#music"

        commandPrefix: "music"
        library: "../music"
        skipLimit: 1
        announceSongs: true
        autoJoinVoiceChannel: "General"
        maxLength: 15
```

**credentials.name:** You can give your bot here a new name and it will change when he joins your server (optional).  
**credentials.email:** The email address of your bot. It is recommend to create a seperate account for your bot (required).  
**credentials.password:** The password of your bot (required).  

**ownerID:** The ID of your main account. This will give you the permission for some commands only the owner should be able to use.  
**serverID:** The ID of the server the bot should join (required).  
**invites:** You can define here multiple invite URLs of servers the bot will automatically join (they should look like: https://discord.gg/0jV29zKlvdJbDx3f). Other formats of invite URLs aren't possible right now.  
**mentionRequired:** If set to true, you have to mention the bot directly (optional).  
**commandPrefix:** Set here the prefix for all your commands (optional). It defaults to `!`  
**reloadConfig:** Set here how fast (in seconds) your `config.cson` should be reloaded automatically without restarting the bot (optional).It default to every 5 seconds. Settings it to `0` disables it.  
**commandCooldown:** You can set a time in milliseconds which the user has to wait until a new command from him will be executed (optional).  
**ignoreChannels:** Here you can define which channels should be ignored by your bot.  

**operators:** You can give other users specific permissions by adding them here (optional). The object key will be the user id.  
**operators.permissions:** The permissions of the operator (optional). You can give the user a wildcard `*` as permission to grant him all permissions.  

**plugins:** Here can you configure you installed plugins.  
**plugins.commandPrefix:** Here you can customize the command prefix of this plugin (optional). It defaults to a prefix defined by the plugin itself.  
**plugins.channel:** You can define here a text channel which the command listens to. If it's not set, it will listen to all channels.
**plugins.commands** You can configure here each command individually  
**plugins.commands.requirePermission** If set to true, it will require permission for this command. If set to false, it will not. If unset it will default to the plugins default.  
**plugins.commands.channel** If set, the command will only work in this channel. If unset, it will work in every channel.  

The other properties listed here are plugin specific.

Need help?
---
Join my Discord server: https://discord.gg/0jV29zKlvdJbDx3f
