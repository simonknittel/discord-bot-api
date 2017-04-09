# Develop your own plugin

The Discord Bot API gets compiled with [Babel](https://babeljs.io), so writing in ES6 is possible.

**1. Create a JavaScript file in the [plugins](../plugins) directory.**

**2. Fill it with the basic skeleton (read the inline comments for more information):**
```javascript
const plugin = {
    name: 'your-plugin', // The bot will look for this name in the config.cson
    defaultCommandPrefix: 'prefix', // Give your plugin a custom command prefix which will be lead by the global command prefix
    commands: { // Define your commands here
        your: { // This key defines the keyword this command listens to
            fn: (user, userID, channelID, message, rawEvent) => { // Parameters which are set by discord.io (see here: https://github.com/izy521/discord.io/wiki/2.-Events#message)
                // Your code here
            },
            description: 'Returns the global command prefix', // The description will be displayed by the general '!commands' command
        },
    },
};

export default plugin;
```

**3. Enable the plugin by starting up your bot and enter `!enable your-plugin`**

**4. Done**

I want to access the `config.cson`
---
**1. Import the configModule with:**
```javascript
import configModule from '../modules/config';
```
**2. Access the config with:**
```javascript
configModule.get().globalCommandPrefix // Returns the globalCommandPrefix set by the config.cson
```

I want to check if a user has a specific permission
---
**1. Import the api with:**
```javascript
import api from '../modules/api';
```
**2. Check for permission with:**
```javascript
api.isOperator(userID, 'your-plugin:yourCommand') // Returns true or false
```

I want to send a message
---
You have full access to an initialized bot instance from [discord.io](https://github.com/izy521/discord.io).

**1. Import the initialized bot instance with:**
```javascript
import bot from '../modules/bot';
```
**2. Send a message with the `discord.io` function:**
```javascript
bot.sendMessage({
    to: channelID,
    message: 'Your message',
});
```

## Examples
Visit the [music bot plugin](../plugins/music) which comes included in the download of the Discord Bot API.

## Need help?
Join my Discord server: https://discord.gg/0jV29zKlvdJbDx3f
