// Plugins
import './_plugins/music-player';
import './_plugins/raffle';
import './_plugins/announcements';

import request from 'request';
import packageJSON from './package';
import cmp from 'semver-compare';

function checkForUpdates() {
    request({
        url: 'https://api.github.com/repos/simonknittel/discord-bot/releases/latest',
        json: true,
        headers: {
            'User-Agent': 'simonknittel',
        },
    }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const currentVersion = packageJSON.version;
            const latestVersion = body.tag_name.substring(1);

            if (cmp(currentVersion, latestVersion) === -1) {
                console.log('There is a new version available for the bot. Run "npm update" to update your bot. You can also visit https://github.com/simonknittel/discord-bot to download the latest version manually.');
                console.log(''); // Empty line
                console.log('Your version:', currentVersion);
                console.log('Latest version:', latestVersion);
                console.log(''); // Empty line
            }
        } else {
            console.error('error:', error);
            console.error('response.statusCode:', response.statusCode);
            console.error('body:', body);
            console.log(''); // Empty line
        }
    });
}

checkForUpdates();
setInterval(checkForUpdates, 3600000);
